const SB_CONFIG = {
  url: "https://puhfcelvvrixlnekprpt.supabase.co",
  key: "sb_publishable_63m-3fyJY26sTOuTGmmCJA_Xn5UYJ5r",
};

const SB_URL = SB_CONFIG.url;
const SB_KEY = SB_CONFIG.key;
const HAS_SUPABASE_CONFIG = Boolean(SB_URL && SB_KEY) && !SB_URL.includes("여기에");
const sb = HAS_SUPABASE_CONFIG && window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;