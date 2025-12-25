document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("pre").forEach(function(pre) {
        // Check if it's a mermaid diagram, skip if so
        if (pre.parentElement.classList.contains("mermaid") || pre.classList.contains("mermaid")) {
            return;
        }

        // Create button
        var button = document.createElement("button");
        button.className = "copy-code-button";
        button.innerText = "Copy";

        // Add click event
        button.addEventListener("click", function() {
            var code = pre.querySelector("code");
            var text = code ? code.innerText : pre.innerText;
            
            navigator.clipboard.writeText(text).then(function() {
                button.innerText = "Copied!";
                setTimeout(function() {
                    button.innerText = "Copy";
                }, 2000);
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        });

        // Position button
        // Ensure pre has relative position for absolute positioning of button
        if (getComputedStyle(pre).position === 'static') {
            pre.style.position = "relative";
        }
        pre.appendChild(button);
    });
});
