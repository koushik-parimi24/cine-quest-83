import { useEffect } from "react";

const MonetagScripts: React.FC = () => {
<>hello</>
  //useEffect(() => {
    // 🟠 Updated OnClick (Popunder) Tag
  //   const popunderScript = document.createElement("script");
  //   popunderScript.textContent = `
  //     (function(s){
  //       s.dataset.zone='10146220',
  //       s.src='https://al5sm.com/tag.min.js'
  //     })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
  //   `;
  //   document.body.appendChild(popunderScript);

  //   // Cleanup on unmount
  //   return () => {
      
  //     document.body.removeChild(popunderScript);
  //   };
  // }, []);

  return <h1>hello</h1>;
};

export default MonetagScripts;
