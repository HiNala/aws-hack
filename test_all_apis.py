#!/usr/bin/env python3
"""
PyroGuard Sentinel - API Key Validation Test Suite
Tests all configured API keys and services
"""

import os
import requests
import json
import boto3
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_anthropic():
    """Test Anthropic API"""
    print("🔍 Testing Anthropic API...")
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Anthropic API key not found")
        return False
    
    print(f"📝 API Key: {api_key[:15]}...")
    
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01'
    }
    
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 10,
        "messages": [
            {"role": "user", "content": "Hello"}
        ]
    }
    
    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Anthropic API: WORKING")
            return True
        else:
            print(f"❌ Anthropic API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Anthropic API Exception: {e}")
        return False

def test_clarifai():
    """Test Clarifai API"""
    print("\n🔍 Testing Clarifai API...")
    
    pat = os.getenv('CLARIFAI_PAT')
    app_id = os.getenv('CLARIFAI_APP_ID')
    user_id = os.getenv('CLARIFAI_USER_ID')
    
    if not all([pat, app_id, user_id]):
        print("❌ Clarifai credentials missing")
        return False
    
    print(f"📝 PAT: {pat[:15]}...")
    print(f"📝 App ID: {app_id}")
    print(f"📝 User ID: {user_id}")
    
    headers = {
        'Authorization': f'Key {pat}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test app access
        response = requests.get(
            f'https://api.clarifai.com/v2/users/{user_id}/apps/{app_id}',
            headers=headers,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Clarifai API: WORKING")
            return True
        else:
            print(f"❌ Clarifai API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Clarifai API Exception: {e}")
        return False

def test_aws():
    """Test AWS credentials"""
    print("\n🔍 Testing AWS API...")
    
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region = os.getenv('AWS_REGION')
    
    if not all([access_key, secret_key, region]):
        print("❌ AWS credentials missing")
        return False
    
    print(f"📝 Access Key: {access_key[:15]}...")
    print(f"📝 Region: {region}")
    
    try:
        # Test S3 access
        s3_client = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        
        # List first few buckets
        response = s3_client.list_buckets()
        print("✅ AWS S3 API: WORKING")
        print(f"📊 Found {len(response['Buckets'])} buckets")
        return True
        
    except Exception as e:
        print(f"❌ AWS API Exception: {e}")
        return False

def test_jira():
    """Test Jira API"""
    print("\n🔍 Testing Jira API...")
    
    token = os.getenv('JIRA_API_TOKEN')
    base_url = os.getenv('JIRA_BASE_URL')
    project_key = os.getenv('JIRA_PROJECT_KEY')
    
    if not all([token, base_url, project_key]):
        print("❌ Jira credentials missing")
        return False
    
    print(f"📝 Base URL: {base_url}")
    print(f"📝 Project Key: {project_key}")
    print(f"📝 Token: {token[:20]}...")
    
    # Use basic auth with email and API token
    # Extract email from Jira base URL - typically username@domain
    email = "nalamaui30@gmail.com"  # Using the contact email from NOAA config
    
    # Create basic auth header
    auth_string = f"{email}:{token}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test project access
        response = requests.get(
            f'{base_url}/rest/api/3/project/{project_key}',
            headers=headers,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            project_data = response.json()
            print("✅ Jira API: WORKING")
            print(f"📊 Project: {project_data.get('name', 'Unknown')}")
            return True
        else:
            print(f"❌ Jira API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Jira API Exception: {e}")
        return False

def test_noaa():
    """Test NOAA API"""
    print("\n🔍 Testing NOAA API...")
    
    user_agent = os.getenv('NOAA_USER_AGENT')
    
    if not user_agent:
        print("❌ NOAA user agent missing")
        return False
    
    print(f"📝 User Agent: {user_agent}")
    
    headers = {
        'User-Agent': user_agent
    }
    
    try:
        # Test weather station access for Hawaii
        response = requests.get(
            'https://api.weather.gov/stations/PHKO',  # Kona station
            headers=headers,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ NOAA API: WORKING")
            return True
        else:
            print(f"❌ NOAA API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ NOAA API Exception: {e}")
        return False

def test_make_webhook():
    """Test Make.com webhook"""
    print("\n🔍 Testing Make.com Webhook...")
    
    webhook_url = os.getenv('MAKE_WEBHOOK_URL')
    
    if not webhook_url:
        print("❌ Make webhook URL missing")
        return False
    
    print(f"📝 Webhook URL: {webhook_url}")
    
    test_payload = {
        "test": True,
        "message": "API validation test",
        "timestamp": "2025-01-26T12:00:00Z"
    }
    
    try:
        response = requests.post(
            webhook_url,
            json=test_payload,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            print("✅ Make.com Webhook: WORKING")
            return True
        else:
            print(f"❌ Make.com Webhook Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Make.com Webhook Exception: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 PyroGuard Sentinel - API Validation Test Suite")
    print("=" * 60)
    
    results = {}
    
    # Test all APIs
    results['anthropic'] = test_anthropic()
    results['clarifai'] = test_clarifai()
    results['aws'] = test_aws()
    results['jira'] = test_jira()
    results['noaa'] = test_noaa()
    results['make'] = test_make_webhook()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 API TEST RESULTS SUMMARY")
    print("=" * 60)
    
    working_count = 0
    total_count = len(results)
    
    for service, status in results.items():
        emoji = "✅" if status else "❌"
        status_text = "WORKING" if status else "FAILED"
        print(f"{emoji} {service.upper()}: {status_text}")
        if status:
            working_count += 1
    
    print(f"\n📈 Overall Status: {working_count}/{total_count} services working ({working_count/total_count*100:.1f}%)")
    
    if working_count >= 4:  # Need at least 4/6 services for basic functionality
        print("🎉 System is ready for deployment!")
    else:
        print("⚠️  System needs attention before deployment")

if __name__ == "__main__":
    main() 