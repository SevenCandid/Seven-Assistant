# Groq Models - Updated January 2025

## 🚨 Important: Model Deprecation

**mixtral-8x7b-32768** has been **DECOMMISSIONED** by Groq!

## ✅ Currently Available Groq Models (Free Tier)

### 1. llama-3.3-70b-versatile ⭐ RECOMMENDED
**Best for: Quality responses**
- **Quality:** ⭐⭐⭐⭐⭐ (Highest quality)
- **Speed:** ⚡⚡⚡ (Moderate)
- **Limits:**
  - 6,000 tokens per minute (TPM)
  - 30 requests per minute (RPM)
  - **100,000 tokens per day (TPD)** ⚠️
- **Context:** 8,192 tokens
- **Use case:** When you need the best answers (but watch daily limit!)

### 2. llama-3.1-8b-instant
**Best for: Fast responses**
- **Quality:** ⭐⭐⭐ (Good)
- **Speed:** ⚡⚡⚡⚡⚡ (Fastest!)
- **Limits:**
  - 6,000 tokens per minute (TPM)
  - 30 requests per minute (RPM)
  - 14,400 requests per day
- **Context:** 8,192 tokens
- **Use case:** Quick conversations, faster responses

### 3. llama-3.1-70b-versatile
**Best for: Balanced performance**
- **Quality:** ⭐⭐⭐⭐ (Very Good)
- **Speed:** ⚡⚡⚡⚡ (Fast)
- **Limits:**
  - 6,000 tokens per minute (TPM)
  - 30 requests per minute (RPM)
  - 14,400 requests per day
- **Context:** 8,192 tokens
- **Use case:** Good middle ground

### 4. gemma2-9b-it
**Best for: Higher rate limits**
- **Quality:** ⭐⭐⭐ (Good)
- **Speed:** ⚡⚡⚡ (Moderate)
- **Limits:**
  - **15,000 tokens per minute (TPM)** ✨ (Best!)
  - 30 requests per minute (RPM)
  - No daily token limit
- **Context:** 8,192 tokens
- **Use case:** When you hit rate limits with other models

---

## 🎯 My New Recommendations

### Option 1: Best Quality → llama-3.3-70b-versatile
**Use if:** You want the smartest responses and don't chat too much

**Pros:**
- ✅ Highest quality responses
- ✅ Best reasoning

**Cons:**
- ❌ Daily limit of 100k tokens (runs out if you chat a lot)
- ❌ Slower than instant

**How to set:**
```
Settings → Model: llama-3.3-70b-versatile
```

### Option 2: Best for Heavy Use → gemma2-9b-it
**Use if:** You chat a LOT and hit rate limits

**Pros:**
- ✅ **15,000 TPM** (2.5x higher than others!)
- ✅ No daily token limit
- ✅ Good enough quality

**Cons:**
- ❌ Not as smart as Llama 3.3
- ❌ Moderate speed

**How to set:**
```
Settings → Model: gemma2-9b-it
```

### Option 3: Fastest Responses → llama-3.1-8b-instant
**Use if:** You want super fast responses

**Pros:**
- ✅ Fastest model available
- ✅ Good for quick questions

**Cons:**
- ❌ Lower quality than 70b models
- ❌ 6,000 TPM limit
- ❌ 14,400 request/day limit

**How to set:**
```
Settings → Model: llama-3.1-8b-instant
```

---

## 📊 Comparison Table

| Model | Quality | Speed | TPM | Daily Limit | Best For |
|-------|---------|-------|-----|-------------|----------|
| **llama-3.3-70b-versatile** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 6,000 | 100k tokens | Quality |
| **llama-3.1-70b-versatile** | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 6,000 | 14.4k req | Balanced |
| **llama-3.1-8b-instant** | ⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 6,000 | 14.4k req | Speed |
| **gemma2-9b-it** | ⭐⭐⭐ | ⚡⚡⚡ | **15,000** | None | Heavy use |

---

## 🔧 Rate Limiting Protection

I've already added automatic rate limiting to your app:
- **Waits 4 seconds between Groq requests**
- Prevents 429 rate limit errors
- You'll see: `⏳ Rate limit protection: Waiting 3s...`

This helps stay within the per-minute limits!

---

## 💡 Still Getting Rate Limits?

### Solution 1: Use Ollama (Unlimited!)
```bash
# Install Ollama
# Download from: https://ollama.com/download

# Pull a model
ollama pull llama3.2

# In Seven AI:
Settings → Provider: Ollama
Settings → Model: llama3.2
```

**Benefits:**
- ✅ Truly unlimited (runs on your computer)
- ✅ Works offline
- ✅ No rate limits
- ✅ Free forever

### Solution 2: Upgrade Groq to Paid
- **$0.50 per 1M tokens** for Llama models
- Much higher rate limits
- https://console.groq.com/settings/billing

### Solution 3: Use Multiple Providers
Switch between providers when you hit limits:
- **Groq** → Use until rate limit
- **Ollama** → Switch when offline or hit limits
- **OpenAI** → Premium option (paid)

---

## 🎯 What to Do Right Now

### Step 1: Pick a Model

**If you want quality:**
```
llama-3.3-70b-versatile
```

**If you chat a lot:**
```
gemma2-9b-it
```

**If you want speed:**
```
llama-3.1-8b-instant
```

### Step 2: Update Settings
1. Open Seven AI
2. Click Settings
3. Find "Model" field
4. Enter one of the models above
5. Click **💾 Save Model Settings**

### Step 3: Test It
Ask Seven a question and verify it works!

---

## 📚 Official Groq Documentation

For the most up-to-date information:
- **Models:** https://console.groq.com/docs/models
- **Rate Limits:** https://console.groq.com/docs/rate-limits
- **Deprecations:** https://console.groq.com/docs/deprecations

---

## ❌ Deprecated/Removed Models

These models NO LONGER WORK:
- ❌ mixtral-8x7b-32768 (decommissioned)
- ❌ llama-3.3-70b-versatile might have older versions

Always check the official docs for the latest!

---

## 🎯 My Final Recommendation

**For most users:**
Use **`llama-3.3-70b-versatile`** for best quality, and if you hit the daily limit, switch to **`gemma2-9b-it`** for the rest of the day.

**Or just use Ollama** for unlimited, free, local AI! 🚀

---

## ✅ Files Updated

- ✅ `src/ui/components/Settings.tsx` - Updated model recommendations
- ✅ `GROQ_MODELS_UPDATED_2025.md` - This guide

---

Sorry for recommending a dead model! These should all work now. 🙏







