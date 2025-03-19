// Function to display data in app when script is run directly
async function displayDataInApp() {
    try {
        // Fetch data from the website
        const url = "https://www.zditm.szczecin.pl/pl/pasazer/rozklady-jazdy/tablica/308"
        const webView = new WebView()

        // Load URL first without showing
        await webView.loadURL(url)

        // Wait for initial loading
        await new Promise(resolve => {
            Timer.schedule(5, false, resolve)
        })

        // Now try to trigger the data loading by simulating some user interactions
        const triggerJS = `
            function triggerDataLoad() {
                // Click any refresh buttons
                const refreshBtns = Array.from(document.querySelectorAll('button, .btn, [type="button"]'))
                    .filter(el => el.textContent.includes('Odśwież') || 
                                  el.textContent.includes('Refresh'));
                
                if (refreshBtns.length > 0) {
                    console.log("Clicking refresh button");
                    refreshBtns[0].click();
                    return true;
                }
                
                // Scroll the page to trigger lazy loading
                window.scrollTo(0, 500);
                window.scrollTo(0, 0);
                
                return "Scroll triggered";
            }
            triggerDataLoad();
        `;

        // Execute the trigger script
        await webView.evaluateJavaScript(triggerJS, false);

        // Wait longer to allow data to load
        await new Promise(resolve => {
            Timer.schedule(15, false, resolve)
        })

        // Now show the WebView to allow user interaction if needed
        await webView.present(false) // false means don't hide when done

        // Wait for user to potentially interact with the page
        await new Promise(resolve => {
            Timer.schedule(3, false, resolve)
        })

        // Extract the title
        const titleJS = `
            const titleElement = document.querySelector("div.flex-fill.text-center > span.fw-bold");
            titleElement ? titleElement.textContent.trim() : "Tablica odjazdów";
        `
        const title = await webView.evaluateJavaScript(titleJS, false)

        // Modified extraction script that doesn't skip placeholders but checks if real data is loaded
        const extractJS = `
        function extractSchedule() {
            console.log("Document ready state: " + document.readyState);
            
            const items = [];
            const listItems = Array.from(document.querySelectorAll("ul.list-unstyled > li"));
            console.log("Found " + listItems.length + " list items");
            
            // Check if we have any non-placeholder items
            const hasRealData = listItems.some(li => !li.querySelector(".placeholder"));
            console.log("Has real data: " + hasRealData);
            
            // If all items are still placeholders, try to find any departure data on the page
            if (!hasRealData) {
                console.log("All items are still placeholders, looking for any time data");
                // Look for any time pattern (HH:MM) on the page
                const allElements = document.querySelectorAll('*');
                const timeElements = Array.from(allElements).filter(el => {
                    if (!el.textContent) return false;
                    return /\\d{1,2}:\\d{2}/.test(el.textContent) &&
                          !el.classList.contains("placeholder") &&
                          !el.querySelector(".placeholder");
                });
                
                console.log("Found " + timeElements.length + " elements with time patterns");
                
                timeElements.forEach((el, index) => {
                    // Find a parent element that might be a row
                    let parent = el;
                    for (let i = 0; i < 5; i++) {
                        parent = parent.parentElement;
                        if (!parent) break;
                        if (parent.classList.contains("row") || parent.tagName === "LI") {
                            break;
                        }
                    }
                    
                    if (parent) {
                        // Try to extract data from this parent row
                        const rowText = parent.textContent.trim();
                        console.log("Row " + index + " text: " + rowText);
                        
                        // Split text by multiple spaces
                        const parts = rowText.split(/\\s{2,}/).map(p => p.trim()).filter(p => p);
                        console.log("Parts: " + JSON.stringify(parts));
                        
                        if (parts.length >= 3) {
                            let lineNumber = "";
                            let time = "";
                            let destination = "";
                            
                            // Try to identify line number, time and destination
                            parts.forEach(part => {
                                if (part.length <= 3 && /^\\d+$/.test(part)) {
                                    lineNumber = part;
                                } else if (/\\d{1,2}:\\d{2}/.test(part)) {
                                    time = part;
                                } else if (part.length > 3) {
                                    destination = part;
                                }
                            });
                            
                            if (lineNumber && time && destination) {
                                items.push({
                                    col1: lineNumber,
                                    col2: time,
                                    col3: destination
                                });
                                console.log("Added item from time element: " + lineNumber + ", " + time + ", " + destination);
                            }
                        }
                    }
                });
            } else {
                // Process normal list items that don't have placeholders
                listItems.forEach((li, index) => {
                    try {
                        // Skip if it contains placeholder
                        if (li.querySelector(".placeholder")) {
                            return;
                        }
                        
                        // Get all text directly
                        const rowText = li.textContent.trim();
                        console.log("Item " + index + " text: " + rowText);
                        
                        // Try to extract data...
                        // [Same extraction code as before]
                        let lineNumber = "";
                        let time = "";
                        let destination = "";
                        
                        // First method: Try to find elements by their structure
                        const lineElement = li.querySelector(".fw-bold");
                        if (lineElement) {
                            lineNumber = lineElement.textContent.trim();
                        }
                        
                        // Find the time element - it usually contains a colon
                        const allElements = Array.from(li.querySelectorAll("*"));
                        const timeElement = allElements.find(el => {
                            return el.textContent.match(/\\d{1,2}:\\d{2}/) && 
                                  !el.querySelector("*"); // Only leaf nodes
                        });
                        
                        if (timeElement) {
                            time = timeElement.textContent.trim();
                        }
                        
                        // Find the destination element (usually has text-end class)
                        const destElement = li.querySelector(".text-end");
                        if (destElement) {
                            destination = destElement.textContent.trim();
                        }
                        
                        // If we couldn't get all parts, try text splitting
                        if (!lineNumber || !time || !destination) {
                            // Split by multiple spaces
                            const parts = rowText.split(/\\s{2,}/g).map(p => p.trim()).filter(p => p);
                            
                            if (parts.length >= 3) {
                                // Try to determine which part is which
                                parts.forEach(part => {
                                    if (!lineNumber && /^\\d{1,3}$/.test(part)) {
                                        lineNumber = part;
                                    } else if (!time && /\\d{1,2}:\\d{2}/.test(part)) {
                                        time = part;
                                    } else if (!destination && part.length > 3) {
                                        destination = part;
                                    }
                                });
                            }
                        }
                        
                        // If we still have data, add to results
                        if (lineNumber && time && destination) {
                            items.push({
                                col1: lineNumber,
                                col2: time,
                                col3: destination
                            });
                            console.log("Added item to results");
                        }
                    } catch (error) {
                        console.error("Error processing item " + index + ": " + error);
                    }
                });
            }
            
            console.log("Total items found: " + items.length);
            return items;
        }
        
        JSON.stringify(extractSchedule());
        `

        const itemsJSON = await webView.evaluateJavaScript(extractJS, false)
        const items = JSON.parse(itemsJSON)

        // Present the data table
        presentTable(title, items)

    } catch (error) {
        // Show error in alert
        let alert = new Alert()
        alert.title = "Error"
        alert.message = error.message
        await alert.present()
    }
}