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
                has_model = any(self.ollama_model in name for name in model_names)
                if not has_model:
                    print(f"⚠️ Ollama is running but model '{self.ollama_model}' not found")
                    print(f"💡 Available models: {model_names}")
                return has_model
            return False
        except Exception as e:
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
        
        # Auto-detect provider
        if provider == "auto":
            if self.is_groq_available():
                provider = "groq"
                print(f"✅ Using Groq with model: {self.groq_model}")
            elif self.is_ollama_available():
                provider = "ollama"
                print(f"✅ Using Ollama with model: {self.ollama_model}")
            else:
                error_msg = "No LLM provider available.\n"
                if not self.groq_api_key:
                    error_msg += "❌ Groq: No API key found (add GROQ_API_KEY to .env)\n"
                else:
                    error_msg += "❌ Groq: API key found but client failed to initialize\n"
                error_msg += "❌ Ollama: Not available (install Ollama and run: ollama pull llama3.2)\n"
                error_msg += "💡 Solution: Add Groq API key to seven-ai-backend/.env"
                raise Exception(error_msg)
        
        # Route to appropriate provider
        if provider == "groq":
            return await self._chat_groq(messages, temperature, max_tokens, stream)
        elif provider == "ollama":
            return await self._chat_ollama(messages, temperature, max_tokens, stream)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def _chat_groq(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> Dict:
        """Chat with Groq API"""
        try:
            response = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
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
            raise Exception(f"Groq API error: {str(e)}")
    
    async def _chat_ollama(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool
    ) -> Dict:
        """Chat with Ollama (local)"""
        try:
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
                return {
                    "message": result.get("message", {}).get("content", ""),
                    "provider": "ollama",
                    "model": self.ollama_model
                }
        except Exception as e:
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

