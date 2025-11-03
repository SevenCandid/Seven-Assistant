"""
LLM Integration - Groq (online) and Ollama (offline) support
"""

import os
import requests
from openai import OpenAI
from typing import Dict, List, Optional
import json

class LLMClient:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_base_url = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
        
        self.groq_client = None
        if self.groq_api_key:
            self.groq_client = OpenAI(
                api_key=self.groq_api_key,
                base_url=self.groq_base_url
            )
    
    def is_groq_available(self) -> bool:
        """Check if Groq API is available"""
        return self.groq_client is not None and self.groq_api_key is not None
    
    def is_ollama_available(self) -> bool:
        """Check if Ollama is running locally with the required model"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            if response.status_code == 200:
                # Check if our model is available
                data = response.json()
                models = data.get('models', [])
                model_names = [m.get('name', '').split(':')[0] for m in models]
                # Check if our model exists (with or without tag)
                # Handle both 'llama3.2' and 'llama3.2:latest' formats
                has_model = any(
                    self.ollama_model == name or 
                    self.ollama_model in name or 
                    name in self.ollama_model 
                    for name in model_names
                )
                if has_model:
                    print(f"✅ Ollama is running with model '{self.ollama_model}'")
                else:
                    print(f"⚠️ Ollama is running but model '{self.ollama_model}' not found")
                    print(f"💡 Available models: {model_names}")
                    print(f"💡 You can install it with: ollama pull {self.ollama_model}")
                return has_model
            return False
        except requests.exceptions.ConnectionError:
            # Ollama service is not running
            return False
        except Exception as e:
            print(f"⚠️ Ollama check failed: {str(e)}")
            return False
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        provider: str = "auto",
        temperature: float = 0.7,
        max_tokens: int = 400,
        stream: bool = False
    ) -> Dict:
        """
        Send chat request to LLM
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            provider: 'groq', 'ollama', or 'auto' (auto-detect)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            stream: Whether to stream response
        
        Returns:
            Dict with 'message', 'provider', 'model'
        """
        
        original_provider = provider
        auto_mode = (provider == "auto")
        
        # Auto-detect provider with smart fallback
        if provider == "auto":
            # Check both providers
            groq_available = self.is_groq_available()
            ollama_available = self.is_ollama_available()
            
            if groq_available:
                provider = "groq"
                print(f"✅ Using Groq with model: {self.groq_model}")
            elif ollama_available:
                provider = "ollama"
                print(f"✅ Using Ollama with model: {self.ollama_model} (offline mode)")
            else:
                error_msg = "No LLM provider available.\n"
                if not self.groq_api_key:
                    error_msg += "❌ Groq: No API key found (add GROQ_API_KEY to .env)\n"
                else:
                    error_msg += "❌ Groq: API key found but client failed to initialize\n"
                if not ollama_available:
                    error_msg += "❌ Ollama: Not available (install Ollama and run: ollama pull llama3.2)\n"
                error_msg += "💡 Solution: Either add Groq API key OR install Ollama for offline mode"
                raise Exception(error_msg)
        
        # Route to appropriate provider with fallback
        if provider == "groq":
            try:
                return await self._chat_groq(messages, temperature, max_tokens, stream, fallback_to_ollama=True)
            except Exception as e:
                # If Groq fails and we were in auto mode, try Ollama as fallback
                if auto_mode and self.is_ollama_available():
                    print(f"⚠️ Groq request failed: {str(e)}")
                    print(f"🔄 Attempting fallback to Ollama...")
                    return await self._chat_ollama(messages, temperature, max_tokens, stream)
                raise
        elif provider == "ollama":
            return await self._chat_ollama(messages, temperature, max_tokens, stream)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def _chat_groq(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool,
        fallback_to_ollama: bool = True
    ) -> Dict:
        """Chat with Groq API with timeout and automatic fallback to Ollama"""
        try:
            import asyncio
            import concurrent.futures
            
            # Run synchronous Groq API call in thread pool with timeout
            def _make_request():
                return self.groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=stream,
                    timeout=15.0  # 15 second timeout for Groq API (faster failover)
                )
            
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                response = await asyncio.wait_for(
                    loop.run_in_executor(executor, _make_request),
                    timeout=15.0  # 15 second timeout (faster failover)
                )
            
            if stream:
                # Handle streaming response
                return {
                    "stream": response,
                    "provider": "groq",
                    "model": self.groq_model
                }
            else:
                message_content = response.choices[0].message.content
                return {
                    "message": message_content,
                    "provider": "groq",
                    "model": self.groq_model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
        except Exception as e:
            error_msg = str(e).lower()
            # Check if it's a network error or offline scenario
            is_offline = any(keyword in error_msg for keyword in [
                "connection", "timeout", "network", "unreachable", 
                "refused", "failed to resolve", "offline"
            ])
            
            # If Groq fails and Ollama is available, fallback automatically
            if fallback_to_ollama and is_offline and self.is_ollama_available():
                print(f"⚠️ Groq API error: {str(e)}")
                print(f"🔄 Falling back to Ollama (offline mode)")
                return await self._chat_ollama(messages, temperature, max_tokens, stream)
            
            raise Exception(f"Groq API error: {str(e)}")
    
    async def _chat_ollama(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> Dict:
        """Chat with Ollama (local) with timeout"""
        try:
            import asyncio
            import aiohttp
            url = f"{self.ollama_url}/api/chat"
            
            # Convert messages to Ollama format
            payload = {
                "model": self.ollama_model,
                "messages": messages,
                "stream": stream,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            # Use longer timeout for Ollama (local processing can take time)
            response = requests.post(url, json=payload, timeout=60)
            
            if response.status_code != 200:
                error_text = response.text
                if "not found" in error_text.lower():
                    raise Exception(f"Ollama model '{self.ollama_model}' not found. Install it with: ollama pull {self.ollama_model}")
                raise Exception(f"Ollama error: {error_text}")
            
            if stream:
                # Return streaming response
                return {
                    "stream": response.iter_lines(),
                    "provider": "ollama",
                    "model": self.ollama_model
                }
            else:
                # Parse non-streaming response
                result = response.json()
                message_content = result.get("message", {}).get("content", "")
                if not message_content:
                    raise Exception("Ollama returned empty response")
                return {
                    "message": message_content,
                    "provider": "ollama",
                    "model": self.ollama_model
                }
        except requests.exceptions.ConnectionError:
            raise Exception(f"Ollama service is not running. Start it with: ollama serve")
        except requests.exceptions.Timeout:
            raise Exception(f"Ollama request timed out. The model may be processing - try again.")
        except Exception as e:
            error_msg = str(e)
            if "Connection" in error_msg or "refused" in error_msg.lower():
                raise Exception(f"Ollama service is not running. Start it with: ollama serve")
            raise Exception(f"Ollama error: {str(e)}")
    
    def get_status(self) -> Dict:
        """Get status of all LLM providers"""
        return {
            "groq": {
                "available": self.is_groq_available(),
                "model": self.groq_model if self.is_groq_available() else None
            },
            "ollama": {
                "available": self.is_ollama_available(),
                "model": self.ollama_model if self.is_ollama_available() else None
            }
        }

# Singleton instance
llm_client = LLMClient()

