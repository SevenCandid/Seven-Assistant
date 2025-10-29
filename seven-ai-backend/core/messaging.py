"""
Messaging System - SMS and WhatsApp via Twilio
"""

import os
from typing import Dict, Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

class MessagingManager:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        
        self.client = None
        self.twilio_enabled = False
        
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                self.twilio_enabled = True
                print("SUCCESS: Twilio messaging enabled")
            except Exception as e:
                print(f"WARNING: Twilio initialization failed: {e}")
        else:
            print("INFO: Twilio not configured - using console fallback")
    
    async def send_sms(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None
    ) -> Dict:
        """
        Send SMS message
        
        Args:
            to: Recipient phone number (e.g., +1234567890)
            message: Message content
            from_number: Sender number (optional, uses default)
        
        Returns:
            Dict with success status and message details
        """
        if not from_number:
            from_number = self.phone_number
        
        if not self.twilio_enabled:
            # Console fallback
            print(f"""
╔══════════════════════════════════════╗
║          📱 SMS MESSAGE              ║
╠══════════════════════════════════════╣
║  From: {from_number}
║  To:   {to}
║  
║  Message:
║  {message}
╚══════════════════════════════════════╝
            """)
            
            return {
                "success": True,
                "mode": "console",
                "message": "SMS logged to console (Twilio not configured)"
            }
        
        try:
            sms = self.client.messages.create(
                body=message,
                from_=from_number,
                to=to
            )
            
            return {
                "success": True,
                "mode": "twilio",
                "message_sid": sms.sid,
                "status": sms.status,
                "to": to,
                "from": from_number
            }
        
        except TwilioRestException as e:
            return {
                "success": False,
                "error": f"Twilio SMS error: {e.msg}",
                "code": e.code
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"SMS error: {str(e)}"
            }
    
    async def send_whatsapp(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None
    ) -> Dict:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to: Recipient number with whatsapp: prefix (e.g., whatsapp:+1234567890)
            message: Message content
            from_number: Sender WhatsApp number (optional)
        
        Returns:
            Dict with success status and message details
        """
        if not from_number:
            from_number = self.whatsapp_number or f"whatsapp:{self.phone_number}"
        
        # Ensure whatsapp: prefix
        if not to.startswith("whatsapp:"):
            to = f"whatsapp:{to}"
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"
        
        if not self.twilio_enabled:
            # Console fallback
            print(f"""
╔══════════════════════════════════════╗
║        💬 WHATSAPP MESSAGE           ║
╠══════════════════════════════════════╣
║  From: {from_number}
║  To:   {to}
║  
║  Message:
║  {message}
╚══════════════════════════════════════╝
            """)
            
            return {
                "success": True,
                "mode": "console",
                "message": "WhatsApp message logged to console (Twilio not configured)"
            }
        
        try:
            wa_message = self.client.messages.create(
                body=message,
                from_=from_number,
                to=to
            )
            
            return {
                "success": True,
                "mode": "twilio",
                "message_sid": wa_message.sid,
                "status": wa_message.status,
                "to": to,
                "from": from_number
            }
        
        except TwilioRestException as e:
            return {
                "success": False,
                "error": f"Twilio WhatsApp error: {e.msg}",
                "code": e.code
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"WhatsApp error: {str(e)}"
            }
    
    def get_status(self) -> Dict:
        """Get messaging service status"""
        return {
            "twilio_enabled": self.twilio_enabled,
            "sms_available": self.twilio_enabled and self.phone_number is not None,
            "whatsapp_available": self.twilio_enabled and self.whatsapp_number is not None,
            "phone_number": self.phone_number if self.twilio_enabled else None,
            "whatsapp_number": self.whatsapp_number if self.twilio_enabled else None
        }

# Singleton instance
messaging_manager = MessagingManager()



