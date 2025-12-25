// Initialize Mermaid
window.addEventListener('DOMContentLoaded', function() {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
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

  // Manually run mermaid on all elements with class 'mermaid'
  const mermaidElements = document.querySelectorAll('.mermaid');
  if (mermaidElements.length > 0) {
    mermaid.run({
      nodes: mermaidElements
    });
  }
});
