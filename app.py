import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json, urllib.request, urllib.parse
from datetime import datetime

st.set_page_config(page_title="TrustTrace AI Ultra", page_icon="🛡️", layout="wide", initial_sidebar_state="expanded")

# ---- imports with fallbacks ----
try:
    from detectors.message_scanner import scan_message
except Exception:
    def scan_message(text):
        flags=[]
        low=text.lower()
        for kw in ["otp","urgent","verify","click here","lottery","kyc","blocked"]:
            if kw in low: flags.append({"rule":kw,"evidence":kw,"severity":"medium"})
        score=min(95, len(flags)*25)
        return {"score":score,"verdict":"Suspicious" if flags else "Likely Safe","findings":flags}
try:
    from detectors.url_inspector import inspect_url
except Exception:
    def inspect_url(url):
        flags=[]
        if "@" in url: flags.append({"rule":"@ in URL","evidence":"@","severity":"high"})
        if url.count(".")>3: flags.append({"rule":"many subdomains","evidence":url,"severity":"low"})
        score=min(90,len(flags)*30)
        return {"score":score,"verdict":"Review needed" if flags else "No obvious issues","findings":flags}
try:
    from engine.risk_engine import compute_risk
except Exception:
    def compute_risk(msg_res, url_res):
        return max(msg_res.get("score",0), url_res.get("score",0) if url_res else 0)
try:
    from i18n.translations import STRINGS
except Exception:
    STRINGS={"en":{"dashboard":"Dashboard","scanner":"Message Scanner","url":"URL Inspector","academy":"Academy","history":"History","scan":"Scan","enter_msg":"Enter message to scan","enter_url":"Enter URL to inspect"},
             "kn":{"dashboard":"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","scanner":"ಸಂದೇಶ ಸ್ಕ್ಯಾನರ್","url":"URL ಪರಿಶೀಲನೆ","academy":"ಅಕಾಡೆಮಿ","history":"ಇತಿಹಾಸ","scan":"ಸ್ಕ್ಯಾನ್ ಮಾಡಿ","enter_msg":"ಸಂದೇಶ ನಮೂದಿಸಿ","enter_url":"URL ನಮೂದಿಸಿ"}}
try:
    from utils.history import add_entry, get_history, clear_history
except Exception:
    if "history" not in st.session_state: st.session_state["history"]=[]
    def add_entry(e): st.session_state["history"].append(e)
    def get_history(): return st.session_state["history"]
    def clear_history(): st.session_state["history"]=[]

CSS="""
<style>
.stApp{background:#0a0e27;color:#e2e8f0}
.glass{background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.25);border-radius:18px;padding:20px;backdrop-filter:blur(12px)}
h1,h2,h3{color:#fff!important}
.stButton>button{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;border:none;border-radius:12px;font-weight:700}
.stTextArea textarea,.stTextInput input{background:rgba(255,255,255,0.06)!important;color:#fff!important;border-radius:12px}
section[data-testid="stSidebar"]{background:#0d1230}
@media(max-width:640px){.glass{padding:14px}}
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)

lang = st.sidebar.selectbox("🌐 Language / ಭಾಷೆ", ["en","kn"], format_func=lambda x:"English" if x=="en" else "ಕನ್ನಡ")
T = STRINGS.get(lang, STRINGS["en"])
page = st.sidebar.radio("Navigate", [T["dashboard"], T["scanner"], T["url"], T["academy"], T["history"]])

st.sidebar.markdown("---")
st.sidebar.subheader("🤖 Gemini (optional)")
api_key = st.sidebar.text_input("Gemini API key", type="password")
consent = st.sidebar.checkbox("I consent to sending scanned text to Gemini API")

def gemini_enhance(prompt_text):
    if not (api_key and consent): return None
    try:
        url=f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={urllib.parse.quote(api_key)}"
        data=json.dumps({"contents":[{"parts":[{"text":prompt_text[:2000]}]}]}).encode()
        req=urllib.request.Request(url,data=data,headers={"Content-Type":"application/json"})
        with urllib.request.urlopen(req,timeout=15) as r:
            j=json.loads(r.read().decode())
        return j["candidates"][0]["content"]["parts"][0]["text"][:1500]
    except Exception as e:
        return f"Gemini call failed: {e}"

if page==T["dashboard"]:
    st.title("🛡️ TrustTrace AI Ultra")
    hist=get_history()
    demo=[{"type":"message","score":20,"date":"2026-10-20"},{"type":"url","score":75,"date":"2026-10-21"},{"type":"message","score":45,"date":"2026-10-22"}]
    st.caption("Demo rows below are labeled simulated.")
    all_rows=hist+[{"simulated":True,**d} for d in demo]
    c1,c2,c3=st.columns(3)
    scores=[r.get("score",0) for r in all_rows]
    c1.markdown(f'<div class="glass"><h3>{len(all_rows)}</h3><p>Total scans</p></div>',unsafe_allow_html=True)
    c2.markdown(f'<div class="glass"><h3>{round(sum(scores)/len(scores),1) if scores else 0}</h3><p>Avg risk score</p></div>',unsafe_allow_html=True)
    c3.markdown(f'<div class="glass"><h3>{sum(1 for s in scores if s>=60)}</h3><p>High-risk</p></div>',unsafe_allow_html=True)
    df=pd.DataFrame(all_rows)
    if not df.empty:
        df["label"]=df.apply(lambda r:"simulated" if r.get("simulated") else "real",axis=1)
        fig1=px.bar(df,x=df.index,y="score",color="label",title="Risk scores (simulated labeled)",color_discrete_map={"real":"#8b5cf6","simulated":"#06b6d4"})
        fig1.update_layout(paper_bgcolor="rgba(0,0,0,0)",plot_bgcolor="rgba(0,0,0,0)",font_color="#e2e8f0")
        st.plotly_chart(fig1,use_container_width=True)

elif page==T["scanner"]:
    st.title("📩 "+T["scanner"])
    text=st.text_area(T["enter_msg"],height=150)
    if st.button("🔍 "+T["scan"]):
        if not text.strip(): st.warning("Please enter a message first.")
        else:
            res=scan_message(text)
            st.subheader(f"Verdict: {res.get('verdict')} — Risk {res.get('score')}/100")
            for f in res.get("findings",[]):
                st.write(f"⚠️ **{f.get('rule')}** — evidence: `{f.get('evidence')}`")
            if not res.get("findings"): st.success("No suspicious patterns found.")
            extra=gemini_enhance(f"Explain phishing risk in this message: {text}")
            if extra: st.info(extra)
            add_entry({"type":"message","score":res.get("score",0),"verdict":res.get("verdict"),"date":datetime.now().isoformat(),"text":text[:200]})

elif page==T["url"]:
    st.title("🔗 "+T["url"])
    url=st.text_input(T["enter_url"],placeholder="https://example.com")
    if st.button("🔍 "+T["scan"]):
        if not url.strip(): st.warning("Please enter a URL.")
        else:
            res=inspect_url(url)
            st.subheader(f"Verdict: {res.get('verdict')} — Risk {res.get('score')}/100")
            for f in res.get("findings",[]):
                st.write(f"⚠️ **{f.get('rule')}** — evidence: `{f.get('evidence')}`")
            st.caption("Note: this tool cannot guarantee any URL is safe.")
            add_entry({"type":"url","score":res.get("score",0),"verdict":res.get("verdict"),"date":datetime.now().isoformat(),"text":url})

elif page==T["academy"]:
    st.title("🎓 "+T["academy"])
    lessons=[("1. Spot phishing messages","Check sender, urgency, links."),("2. URL tricks","Look for @, punycode, long subdomains."),("3. OTP fraud","Banks never ask OTP on call."),("4. KYC scams","Don't install apps from links."),("5. Lottery scams","Advance-fee traps."),("6. Report","Report to cybercrime.gov.in")]
    for title,body in lessons:
        with st.expander(title): st.write(body)

elif page==T["history"]:
    st.title("📜 "+T["history"])
    hist=get_history()
    if not hist: st.info("No history yet.")
    else:
        st.dataframe(pd.DataFrame(hist))
        st.download_button("⬇️ CSV",pd.DataFrame(hist).to_csv(index=False),"history.csv","text/csv")
        st.download_button("⬇️ JSON",json.dumps(hist,indent=2),"history.json","application/json")
        if st.button("Clear history"): clear_history(); st.rerun()
