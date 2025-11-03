# 📚 Knowledge Base - Quick Start Guide

Get Seven's RAG system running in 5 minutes!

## ⚡ Quick Setup

### Step 1: Install Dependencies

```bash
cd seven-ai-backend
pip install faiss-cpu sentence-transformers PyPDF2
```

### Step 2: Restart Backend

```bash
# Stop current backend (Ctrl+C)
python main.py
```

You should see:
```
✅ Knowledge base initialized with FAISS
```

### Step 3: Test It!

Open Seven's UI → **Settings** → **📚 Knowledge Base**

## 🎯 Quick Test

### Add Sample Knowledge

1. Click **✍️ Add Text** tab
2. Enter:
   - **Title:** "My Favorite Color"
   - **Content:** "My favorite color is blue because it's calming."
3. Click **Add Knowledge**
4. You should see: "✅ Knowledge added successfully!"

### Ask Seven

Go back to chat and ask:
> "What's my favorite color?"

Seven will respond using the knowledge you just added! 🎉

## 📤 Upload a File

### Test PDF Upload

1. Create a simple text file `test.txt`:
```
Company Information:
Seven AI Assistant is an intelligent assistant built with React and FastAPI.
It features voice recognition, vision capabilities, and a local RAG system.
```

2. In Settings → **📚 Knowledge Base**:
   - Click **📤 Upload** tab
   - Select `test.txt`
   - Optional: Enter custom title
   - Click **Upload File**

3. Ask Seven:
> "Tell me about Seven AI Assistant"

Seven will use the uploaded knowledge!

## 🔍 View Your Knowledge

Click **📖 View** tab to see all entries:
- View titles and content
- See when each was added
- Delete individual entries
- Clear all with one click

## 📊 Check Stats

Open DevTools (F12) and run:

```javascript
fetch('http://localhost:5000/api/knowledge/stats')
  .then(r => r.json())
  .then(console.log)
```

You should see:
```json
{
  "total_entries": 2,
  "index_size": 2,
  "available": true
}
```

## 🎓 Real-World Example

### Scenario: Company Knowledge Base

**Add Product Info:**
```
Title: Product Pricing
Content: Our Standard plan is $29/month. Professional is $99/month. Enterprise is custom pricing with dedicated support.
```

**Add Support Info:**
```
Title: Refund Policy  
Content: We offer 30-day money-back guarantee. Contact support@company.com for refunds.
```

**Now ask Seven:**
- "What's the price of the standard plan?"
- "How do I get a refund?"

Seven will answer using your knowledge base!

## 🛠️ Troubleshooting

### Knowledge base unavailable?

**Check:**
```bash
pip show faiss-cpu sentence-transformers
```

If not found:
```bash
pip install faiss-cpu sentence-transformers PyPDF2
```

### Upload fails?

**Check file format:**
- ✅ Supported: `.pdf`, `.txt`, `.md`
- ❌ Not supported: `.docx`, `.xlsx`, images

**Workaround:** Copy text to a `.txt` file

### Seven doesn't use knowledge?

**Possible causes:**
1. **Low similarity**: Knowledge not relevant to query
2. **Backend offline**: Check if backend is running
3. **Empty knowledge base**: Add knowledge first

**Debug:** Check backend logs for:
```
📚 Retrieved X knowledge entries
```

## 💡 Pro Tips

### Tip 1: Be Specific
Good: "The CEO's name is John Smith. He founded the company in 2020."
Bad: "John Smith 2020"

### Tip 2: Test Retrieval
Before asking Seven, test if knowledge is found:
```bash
curl -X POST http://localhost:5000/api/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{"query": "CEO name", "top_k": 1}'
```

### Tip 3: Organize with Titles
Use clear, searchable titles:
- "HR: Remote Work Policy"
- "Tech: API Documentation"  
- "Sales: Q4 2024 Targets"

## 🚀 Next Steps

Now that it works, try:

1. **Upload a real document**: PDF manual, notes, wiki page
2. **Add company-specific info**: Policies, procedures, FAQs
3. **Build a knowledge base**: Collect important info for Seven
4. **Test edge cases**: See how well semantic search works

## 📚 Learn More

- Full documentation: `KNOWLEDGE_BASE.md`
- Technical details: `KNOWLEDGE_IMPLEMENTATION_SUMMARY.md`
- API reference: See `/api/knowledge/*` endpoints

---

**Ready to teach Seven?** Start adding knowledge and make your assistant smarter! 🧠✨











