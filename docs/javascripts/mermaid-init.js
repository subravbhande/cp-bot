// Initialize Mermaid with dark theme support
document$.subscribe(function() {
  // Detect current theme
  const palette = __md_get("__palette");
  const isDark = palette && palette.color && palette.color.scheme === "slate";
  
  // Configure Mermaid based on theme
  mermaid.initialize({
    startOnLoad: true,
    theme: isDark ? 'dark' : 'default',
    themeVariables: isDark ? {
      darkMode: true,
      background: '#1e1e1e',
      primaryColor: '#4db6ac',
      primaryTextColor: '#e0e0e0',
      primaryBorderColor: '#26a69a',
      lineColor: '#80cbc4',
      secondaryColor: '#7e57c2',
      tertiaryColor: '#29b6f6',
      mainBkg: '#263238',
      secondBkg: '#37474f',
      border1: '#546e7a',
      border2: '#78909c',
      note: '#455a64',
      noteBkg: '#37474f',
      noteText: '#e0e0e0',
      noteBorder: '#607d8b',
      fontFamily: 'Roboto, sans-serif',
      fontSize: '15px'
    } : {
      primaryColor: '#4db6ac',
      primaryTextColor: '#263238',
      primaryBorderColor: '#26a69a',
      lineColor: '#00897b',
      secondaryColor: '#9575cd',
      tertiaryColor: '#29b6f6',
      fontFamily: 'Roboto, sans-serif',
      fontSize: '15px'
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
      padding: 20,
      nodeSpacing: 80,
      rankSpacing: 80
    },
    sequence: {
      useMaxWidth: true
    },
    gantt: {
      useMaxWidth: true
    }
  });
  
  // Re-render diagrams when theme changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === "data-md-color-scheme") {
        location.reload();
      }
    });
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-md-color-scheme"]
  });
});
