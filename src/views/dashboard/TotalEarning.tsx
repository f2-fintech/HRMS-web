import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useRef, memo } from 'react';

// Styled Card component with gradient background and white content area
const GradientCard = styled(Card)(({ theme }) => ({
  height: "410px",
  overflowY: "scroll",
  background: `linear-gradient(135deg, 
    #6a82fb 0%,
    #fc5c7d 100%)`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#fc5c7d',
    borderRadius: '4px',
  },
  '&:hover': {
    boxShadow: theme.shadows[6],
    transition: 'box-shadow 0.3s ease-in-out',
  },
  padding: theme.spacing(2),
}));

// Inner container with white background
const WhiteContainer = styled('div')({
  backgroundColor: '#ffffff',
  borderRadius: 'inherit',
  height: '100%',
  padding: '16px',
});

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

    return () => {
      // Cleanup function remains empty as per original code
    };
  }, []);

  return (
    <GradientCard>
      <WhiteContainer>
        <div
          className="tradingview-widget-container"
          ref={container}
        >
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </WhiteContainer>
    </GradientCard>
  );
}

export default memo(TradingViewWidget);
