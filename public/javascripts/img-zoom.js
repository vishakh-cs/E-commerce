function imageZoom(imgID, resultID) {
    var img, lens, result, cx, cy;
    img = document.getElementById(imgID);
    result = document.getElementById(resultID);

    result.hidden = true;

    // Calculate the ratio between result DIV and lens
    cx = result.offsetWidth / 2;
    cy = result.offsetHeight / 2;

    // Create lens
    lens = document.createElement("DIV");
    lens.setAttribute("class", "img-zoom-lens");
    // Insert lens
    img.parentElement.insertBefore(lens, img);

    // Set background properties for the result DIV
    result.style.backgroundImage = "url('" + img.src + "')";
    result.style.backgroundSize = (img.width * 2) + "px " + (img.height * 2) + "px";

    // Add event listeners
    img.addEventListener("mouseenter", showResult);
    img.addEventListener("mousemove", moveLens);
    img.addEventListener("mouseleave", hideResult);
    img.addEventListener("touchstart", showResult);
    img.addEventListener("touchmove", moveLens);
    img.addEventListener("touchend", hideResult);

    function showResult(e) {
        // Show the result div when hovering over the image
        result.hidden = false;
    }

    function hideResult() {
        // Hide the result div when moving away from the image
        result.hidden = true;
    }

    function moveLens(e) {
        var pos, x, y;
        // Prevent any other actions that may occur when moving over the image
        e.preventDefault();
        // Get the cursor's x and y positions
        pos = getCursorPos(e);
        // Calculate the position of the lens
        x = pos.x - cx;
        y = pos.y - cy;
        // Prevent the lens from being positioned outside the image
        if (x > img.width - 2 * cx) {
            x = img.width - 2 * cx;
        }
        if (x < 0) {
            x = 0;
        }
        if (y > img.height - 2 * cy) {
            y = img.height - 2 * cy;
        }
        if (y < 0) {
            y = 0;
        }
        // Set the position of the lens
        lens.style.left = x + "px";
        lens.style.top = y + "px";
        // Display what the lens "sees"
        result.style.backgroundPosition = "-" + (x * 2) + "px -" + (y * 2) + "px";
    }

    function getCursorPos(e) {
        var a, x = 0, y = 0;
        e = e || window.event;
        // Get the x and y positions of the image
        a = img.getBoundingClientRect();
        // Calculate the cursor's x and y coordinates, relative to the image
        x = e.pageX - a.left;
        y = e.pageY - a.top;
        // Consider any page scrolling
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return {x: x, y: y};
    }
}
