#!/usr/bin/env python3
"""
PyroGuard Sentinel - API Credentials Test Script
Tests all sponsor tool integrations and provides specific fix instructions
"""

import os
import asyncio
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print('='*60)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def print_info(message):
    print(f"💡 {message}")

async def test_clarifai():
    """Test Clarifai API credentials and app setup"""
    print_header("Testing Clarifai API")
    
    pat = os.getenv("CLARIFAI_PAT")
    user_id = os.getenv("CLARIFAI_USER_ID")
    app_id = os.getenv("CLARIFAI_APP_ID")
    
    if not pat:
        print_error("CLARIFAI_PAT not set")
        print_info("Fix: Get PAT from https://clarifai.com/settings/security")
        return False
    
    if not user_id:
        print_error("CLARIFAI_USER_ID not set")
        print_info("Fix: Check your Clarifai username in profile dropdown")
        return False
    
    if not app_id:
        print_error("CLARIFAI_APP_ID not set")
        print_info("Fix: Set CLARIFAI_APP_ID=pyroguard-app")
        return False
    
    try:
        headers = {
            "Authorization": f"Key {pat}",
            "Content-Type": "application/json"
        }
        
        # Test user access
        print(f"Testing user access for: {user_id}")
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(
                f"https://api.clarifai.com/v2/users/{user_id}",
                headers=headers,
                timeout=10.0
            )
            
            if user_resp.status_code == 401:
                print_error("Authentication failed - Invalid PAT")
                print_info("Fix: Generate new PAT at https://clarifai.com/settings/security")
                return False
            elif user_resp.status_code == 404:
                print_error(f"User '{user_id}' not found")
                print_info("Fix: Check CLARIFAI_USER_ID matches your Clarifai username")
                return False
            elif user_resp.status_code != 200:
                print_error(f"User API error: HTTP {user_resp.status_code}")
                return False
            
            print_success("User authentication successful")
            
            # Test app access
            print(f"Testing app access for: {app_id}")
            app_resp = await client.get(
                f"https://api.clarifai.com/v2/users/{user_id}/apps/{app_id}",
                headers=headers,
                timeout=10.0
            )
            
            if app_resp.status_code == 404:
                print_error(f"App '{app_id}' not found")
                print_info("Fix Steps:")
                print_info("1. Go to https://clarifai.com/explore")
                print_info("2. Click 'Apps' → 'Create App'")
                print_info("3. Name: 'pyroguard-app' (exactly)")
                print_info("4. Use Case: 'Visual Recognition'")
                return False
            elif app_resp.status_code != 200:
                print_error(f"App access error: HTTP {app_resp.status_code}")
                return False
            
            print_success("App access successful")
            
            # Test models
            models_resp = await client.get(
                f"https://api.clarifai.com/v2/users/{user_id}/apps/{app_id}/models",
                headers=headers,
                timeout=10.0
            )
            
            if models_resp.status_code == 200:
                models = models_resp.json().get("models", [])
                print_success(f"Found {len(models)} models in app")
                if len(models) == 0:
                    print_warning("No models found in app")
                    print_info("Consider adding NDVI or Land Cover models from Model Gallery")
            
            return True
            
    except Exception as e:
        print_error(f"Clarifai test failed: {e}")
        return False

async def test_anthropic():
    """Test Anthropic API credentials"""
    print_header("Testing Anthropic API")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print_error("ANTHROPIC_API_KEY not set")
        print_info("Fix: Get API key from https://console.anthropic.com")
        return False
    
    if not api_key.startswith("sk-ant-"):
        print_error("Invalid ANTHROPIC_API_KEY format")
        print_info("Fix: API key should start with 'sk-ant-'")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "test"}]
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                print_success("Anthropic API access confirmed")
                return True
            elif response.status_code == 401:
                print_error("Authentication failed - Invalid API key")
                print_info("Fix: Generate new API key at https://console.anthropic.com")
                return False
            else:
                print_error(f"API error: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print_error(f"Anthropic test failed: {e}")
        return False

async def test_make_webhook():
    """Test Make.com webhook"""
    print_header("Testing Make.com Webhook")
    
    webhook_url = os.getenv("MAKE_WEBHOOK_URL")
    
    if not webhook_url:
        print_error("MAKE_WEBHOOK_URL not set")
        print_info("Fix: Create scenario at https://make.com and add webhook trigger")
        return False
    
    if not webhook_url.startswith("https://hook."):
        print_error("Invalid MAKE_WEBHOOK_URL format")
        print_info("Fix: URL should start with 'https://hook.'")
        return False
    
    try:
        test_payload = {
            "test": True,
            "message": "PyroGuard Sentinel webhook test",
            "timestamp": datetime.now().isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=test_payload,
                headers={"Content-Type": "application/json"},
                timeout=15.0
            )
            
            if response.status_code == 200:
                print_success("Make.com webhook accessible")
                return True
            else:
                print_error(f"Webhook error: HTTP {response.status_code}")
                print_info("Fix: Check webhook URL and Make.com scenario configuration")
                return False
                
    except Exception as e:
        print_error(f"Make.com webhook test failed: {e}")
        return False

def test_aws():
    """Test AWS credentials"""
    print_header("Testing AWS Credentials")
    
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    region = os.getenv("AWS_REGION")
    
    if not access_key:
        print_error("AWS_ACCESS_KEY_ID not set")
        return False
    
    if not secret_key:
        print_error("AWS_SECRET_ACCESS_KEY not set")
        return False
    
    if not region:
        print_error("AWS_REGION not set")
        return False
    
    print_success(f"AWS credentials configured (region: {region})")
    print_info("Note: S3 access will be tested during actual analysis")
    return True

def test_jira():
    """Test Jira credentials"""
    print_header("Testing Jira Configuration")
    
    api_token = os.getenv("JIRA_API_TOKEN")
    base_url = os.getenv("JIRA_BASE_URL")
    project_key = os.getenv("JIRA_PROJECT_KEY")
    
    if not api_token:
        print_error("JIRA_API_TOKEN not set")
        print_info("Fix: Generate token at https://id.atlassian.com/manage-profile/security/api-tokens")
        return False
    
    if not base_url:
        print_error("JIRA_BASE_URL not set")
        print_info("Fix: Set to your Jira Cloud URL (e.g., https://yourcompany.atlassian.net)")
        return False
    
    if not project_key:
        print_error("JIRA_PROJECT_KEY not set")
        print_info("Fix: Set to your project key (e.g., PYRO)")
        return False
    
    print_success("Jira credentials configured")
    print_info("Note: Jira API access will be tested via Make.com webhook")
    return True

async def main():
    """Run all API credential tests"""
    print("🔥 PyroGuard Sentinel - API Credentials Test")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test all integrations
    results.append(("Clarifai", await test_clarifai()))
    results.append(("Anthropic", await test_anthropic()))
    results.append(("Make.com", await test_make_webhook()))
    results.append(("AWS", test_aws()))
    results.append(("Jira", test_jira()))
    
    # Summary
    print_header("Summary Results")
    
    passed = 0
    total = len(results)
    
    for service, success in results:
        if success:
            print_success(f"{service}: PASS")
            passed += 1
        else:
            print_error(f"{service}: FAIL")
    
    print(f"\n📊 Overall: {passed}/{total} services configured correctly")
    
    if passed == total:
        print_success("🎉 All API integrations ready!")
        print_info("You can now run PyroGuard Sentinel with full functionality")
    else:
        print_warning(f"⚠️  {total - passed} services need attention")
        print_info("Fix the failing services above before full deployment")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(main()) 