"""
External Service Integrations
Google Calendar, Gmail, YouTube, X (Twitter)
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import requests

# Try to import Google API libraries (optional)
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("WARNING: Google API libraries not installed. Install with: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")


class GoogleCalendarIntegration:
    """
    Google Calendar Integration
    Manages calendar events, meetings, reminders
    """
    
    def __init__(self):
        """Initialize Google Calendar integration"""
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.credentials = None
        self.available = GOOGLE_AVAILABLE and bool(self.api_key)
        
        if not self.available:
            print("INFO: Google Calendar not configured")
    
    def is_available(self) -> bool:
        """Check if Calendar API is available"""
        return self.available
    
    def set_credentials(self, credentials_dict: Dict):
        """Set user OAuth credentials"""
        if not GOOGLE_AVAILABLE:
            return False
        
        try:
            self.credentials = Credentials.from_authorized_user_info(credentials_dict)
            self.available = True
            return True
        except Exception as e:
            print(f"ERROR: Failed to set credentials: {e}")
            return False
    
    def list_events(
        self,
        max_results: int = 10,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None
    ) -> List[Dict]:
        """
        List upcoming calendar events
        
        Args:
            max_results: Maximum number of events to return
            time_min: Start time (defaults to now)
            time_max: End time (defaults to 7 days from now)
            
        Returns:
            List of calendar events
        """
        if not self.is_available():
            return []
        
        try:
            service = build('calendar', 'v3', credentials=self.credentials)
            
            # Default time range: now to 7 days from now
            if not time_min:
                time_min = datetime.utcnow()
            if not time_max:
                time_max = time_min + timedelta(days=7)
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min.isoformat() + 'Z',
                timeMax=time_max.isoformat() + 'Z',
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Format events
            formatted_events = []
            for event in events:
                formatted_events.append({
                    'id': event.get('id'),
                    'summary': event.get('summary', 'No title'),
                    'start': event.get('start', {}).get('dateTime', event.get('start', {}).get('date')),
                    'end': event.get('end', {}).get('dateTime', event.get('end', {}).get('date')),
                    'location': event.get('location', ''),
                    'description': event.get('description', '')
                })
            
            return formatted_events
        
        except HttpError as e:
            print(f"ERROR: Calendar API error: {e}")
            return []
        except Exception as e:
            print(f"ERROR: Failed to list events: {e}")
            return []
    
    def create_event(
        self,
        summary: str,
        start_time: datetime,
        end_time: datetime,
        description: str = "",
        location: str = ""
    ) -> Optional[Dict]:
        """
        Create a calendar event
        
        Args:
            summary: Event title
            start_time: Start datetime
            end_time: End datetime
            description: Event description
            location: Event location
            
        Returns:
            Created event or None
        """
        if not self.is_available():
            return None
        
        try:
            service = build('calendar', 'v3', credentials=self.credentials)
            
            event = {
                'summary': summary,
                'location': location,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'UTC',
                },
            }
            
            event = service.events().insert(calendarId='primary', body=event).execute()
            
            return {
                'id': event.get('id'),
                'summary': event.get('summary'),
                'start': event.get('start', {}).get('dateTime'),
                'link': event.get('htmlLink')
            }
        
        except HttpError as e:
            print(f"ERROR: Calendar API error: {e}")
            return None
        except Exception as e:
            print(f"ERROR: Failed to create event: {e}")
            return None


class GmailIntegration:
    """
    Gmail Integration
    Send and read emails
    """
    
    def __init__(self):
        """Initialize Gmail integration"""
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.credentials = None
        self.available = GOOGLE_AVAILABLE and bool(self.api_key)
        
        if not self.available:
            print("INFO: Gmail not configured")
    
    def is_available(self) -> bool:
        """Check if Gmail API is available"""
        return self.available
    
    def set_credentials(self, credentials_dict: Dict):
        """Set user OAuth credentials"""
        if not GOOGLE_AVAILABLE:
            return False
        
        try:
            self.credentials = Credentials.from_authorized_user_info(credentials_dict)
            self.available = True
            return True
        except Exception as e:
            print(f"ERROR: Failed to set credentials: {e}")
            return False
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to: Recipient email
            subject: Email subject
            body: Email body
            from_email: Sender email (optional)
            
        Returns:
            True if sent successfully
        """
        if not self.is_available():
            return False
        
        try:
            service = build('gmail', 'v1', credentials=self.credentials)
            
            message = {
                'raw': self._create_message(to, from_email or 'me', subject, body)
            }
            
            service.users().messages().send(userId='me', body=message).execute()
            print(f"SUCCESS: Email sent to {to}")
            return True
        
        except HttpError as e:
            print(f"ERROR: Gmail API error: {e}")
            return False
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            return False
    
    def _create_message(self, to: str, sender: str, subject: str, body: str) -> str:
        """Create email message in base64 format"""
        import base64
        from email.mime.text import MIMEText
        
        message = MIMEText(body)
        message['to'] = to
        message['from'] = sender
        message['subject'] = subject
        
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return raw
    
    def list_recent_emails(self, max_results: int = 10) -> List[Dict]:
        """
        List recent emails
        
        Args:
            max_results: Maximum number of emails
            
        Returns:
            List of recent emails
        """
        if not self.is_available():
            return []
        
        try:
            service = build('gmail', 'v1', credentials=self.credentials)
            
            results = service.users().messages().list(
                userId='me',
                maxResults=max_results,
                labelIds=['INBOX']
            ).execute()
            
            messages = results.get('messages', [])
            
            # Get message details
            emails = []
            for msg in messages:
                message = service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='metadata',
                    metadataHeaders=['From', 'Subject', 'Date']
                ).execute()
                
                headers = {h['name']: h['value'] for h in message.get('payload', {}).get('headers', [])}
                
                emails.append({
                    'id': message['id'],
                    'from': headers.get('From', ''),
                    'subject': headers.get('Subject', ''),
                    'date': headers.get('Date', ''),
                    'snippet': message.get('snippet', '')
                })
            
            return emails
        
        except HttpError as e:
            print(f"ERROR: Gmail API error: {e}")
            return []
        except Exception as e:
            print(f"ERROR: Failed to list emails: {e}")
            return []


class YouTubeIntegration:
    """
    YouTube Integration
    Search videos, get trending content
    """
    
    def __init__(self):
        """Initialize YouTube integration"""
        self.api_key = os.getenv("YOUTUBE_API_KEY", "")
        self.available = bool(self.api_key)
        
        if not self.available:
            print("INFO: YouTube API not configured")
    
    def is_available(self) -> bool:
        """Check if YouTube API is available"""
        return self.available
    
    def search_videos(
        self,
        query: str,
        max_results: int = 10,
        order: str = "relevance"
    ) -> List[Dict]:
        """
        Search YouTube videos
        
        Args:
            query: Search query
            max_results: Maximum results
            order: Sort order (relevance, date, rating, viewCount)
            
        Returns:
            List of video results
        """
        if not self.is_available():
            return []
        
        try:
            url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                'part': 'snippet',
                'q': query,
                'maxResults': max_results,
                'order': order,
                'type': 'video',
                'key': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for item in data.get('items', []):
                videos.append({
                    'video_id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'channel': item['snippet']['channelTitle'],
                    'published_at': item['snippet']['publishedAt'],
                    'thumbnail': item['snippet']['thumbnails']['high']['url'],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                })
            
            return videos
        
        except requests.exceptions.RequestException as e:
            print(f"ERROR: YouTube API error: {e}")
            return []
        except Exception as e:
            print(f"ERROR: Failed to search videos: {e}")
            return []


class XIntegration:
    """
    X (Twitter) Integration
    Post tweets, read timeline
    """
    
    def __init__(self):
        """Initialize X integration"""
        self.api_key = os.getenv("X_API_KEY", "")
        self.api_secret = os.getenv("X_API_SECRET", "")
        self.access_token = os.getenv("X_ACCESS_TOKEN", "")
        self.access_secret = os.getenv("X_ACCESS_SECRET", "")
        self.bearer_token = os.getenv("X_BEARER_TOKEN", "")
        
        self.available = all([
            self.bearer_token or (self.api_key and self.api_secret)
        ])
        
        if not self.available:
            print("INFO: X (Twitter) API not configured")
    
    def is_available(self) -> bool:
        """Check if X API is available"""
        return self.available
    
    def post_tweet(self, text: str) -> Optional[Dict]:
        """
        Post a tweet
        
        Args:
            text: Tweet text (max 280 chars)
            
        Returns:
            Tweet data or None
        """
        if not self.is_available():
            return None
        
        if len(text) > 280:
            print("ERROR: Tweet exceeds 280 characters")
            return None
        
        try:
            url = "https://api.twitter.com/2/tweets"
            headers = {
                'Authorization': f'Bearer {self.bearer_token}',
                'Content-Type': 'application/json'
            }
            data = {'text': text}
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'id': result.get('data', {}).get('id'),
                'text': result.get('data', {}).get('text'),
                'url': f"https://twitter.com/i/web/status/{result.get('data', {}).get('id')}"
            }
        
        except requests.exceptions.RequestException as e:
            print(f"ERROR: X API error: {e}")
            return None
        except Exception as e:
            print(f"ERROR: Failed to post tweet: {e}")
            return None


# Singleton instances
google_calendar = GoogleCalendarIntegration()
gmail = GmailIntegration()
youtube = YouTubeIntegration()
x_integration = XIntegration()


class IntegrationManager:
    """
    Manages all external integrations
    """
    
    def __init__(self):
        """Initialize integration manager"""
        self.calendar = google_calendar
        self.gmail = gmail
        self.youtube = youtube
        self.x = x_integration
    
    def get_status(self) -> Dict[str, bool]:
        """Get status of all integrations"""
        return {
            'google_calendar': self.calendar.is_available(),
            'gmail': self.gmail.is_available(),
            'youtube': self.youtube.is_available(),
            'x': self.x.is_available()
        }
    
    def get_available_actions(self) -> List[str]:
        """Get list of available integration actions"""
        actions = []
        
        if self.calendar.is_available():
            actions.extend(['list_calendar_events', 'create_calendar_event'])
        
        if self.gmail.is_available():
            actions.extend(['send_email', 'list_recent_emails'])
        
        if self.youtube.is_available():
            actions.append('search_youtube')
        
        if self.x.is_available():
            actions.append('post_tweet')
        
        return actions


# Singleton
integration_manager = IntegrationManager()





