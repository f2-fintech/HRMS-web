import React, { useEffect, useRef, memo } from 'react';

import { Card } from '@mui/material';

// Global flag to check if the script has been loaded
let scriptLoaded = false;

function TradingViewWidget() {
  const container = useRef();

  useEffect(() => {
    if (!scriptLoaded) {
      const script = document.createElement("script");

      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `   
  {
  "colorTheme": "light",
  "dateRange": "3M",
  "exchange": "BSE",
  "showChart": true,
  "locale": "en",
  "largeChartUrl": "",
  "isTransparent": false,
  "showSymbolLogo": true,
  "showFloatingTooltip": true,
  "width": "685",
  "height": "500",
  "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
  "plotLineColorFalling": "rgba(41, 98, 255, 1)",
  "gridLineColor": "rgba(42, 46, 57, 0)",
  "scaleFontColor": "rgba(19, 23, 34, 1)",
  "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
  "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
  "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
  "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
  "symbolActiveColor": "rgba(41, 98, 255, 0.12)"
}`;
      container.current.appendChild(script);
      scriptLoaded = true;
    }

    // Cleanup function
    return () => {

    };
  }, []);

  return (
    <Card sx={{ height: "380px", overflowY: "scroll" }}>
      <div
        className="tradingview-widget-container"
        ref={container}
      >
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </Card>

  );
}

export default memo(TradingViewWidget);
