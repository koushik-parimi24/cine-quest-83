import { useEffect } from "react";

const MonetagScripts: React.FC = () => {
  useEffect(() => {
    // 🟣 Updated Push Notification Tag
    const pushScript = document.createElement("script");
    pushScript.src = "https://3nbf4.com/act/files/tag.min.js?z=10146225";
    pushScript.async = true;
    pushScript.setAttribute("data-cfasync", "false");
    document.body.appendChild(pushScript);

    // 🟠 Updated OnClick (Popunder) Tag
    const popunderScript = document.createElement("script");
    popunderScript.textContent = `
      (function(s){
        s.dataset.zone='10146220',
        s.src='https://al5sm.com/tag.min.js'
      })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
    `;
    document.body.appendChild(popunderScript);

    // Cleanup on unmount
    return () => {
      document.body.removeChild(pushScript);
      document.body.removeChild(popunderScript);
    };
  }, []);

  return null;
};

export default MonetagScripts;
