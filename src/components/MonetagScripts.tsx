import { useEffect } from "react";

const MonetagScripts: React.FC = () => {
  useEffect(() => {
    // 🟣 Push Notification Tag
    const pushScript = document.createElement("script");
    pushScript.src = "https://3nbf4.com/act/files/tag.min.js?z=10143230";
    pushScript.async = true;
    pushScript.setAttribute("data-cfasync", "false");
    document.body.appendChild(pushScript);

    // 🟠 Popunder Tag
    const popunderScript = document.createElement("script");
    popunderScript.textContent = `
      (function(s){
        s.dataset.zone='10143226';
        s.src='https://al5sm.com/tag.min.js';
      })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
    `;
    document.body.appendChild(popunderScript);

    // 🟢 Vignette Tag
    const vignetteScript = document.createElement("script");
    vignetteScript.textContent = `
      (function(s){
        s.dataset.zone='10143748';
        s.src='https://groleegni.net/vignette.min.js';
      })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
    `;
    document.body.appendChild(vignetteScript);

    // 🔵 Banner/Ad Tag
    const bannerScript = document.createElement("script");
    bannerScript.src = "https://fpyf8.com/88/tag.min.js";
    bannerScript.async = true;
    bannerScript.setAttribute("data-zone", "182969");
    bannerScript.setAttribute("data-cfasync", "false");
    document.body.appendChild(bannerScript);

    // 🧹 Cleanup on unmount (avoid duplicate injection)
    return () => {
      document.body.removeChild(pushScript);
      document.body.removeChild(popunderScript);
      document.body.removeChild(vignetteScript);
      document.body.removeChild(bannerScript);
    };
  }, []);

  return null;
};

export default MonetagScripts;
