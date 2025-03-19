// Name: ZDiTM Szczecin Schedule
// Description: Program dla Taty :* do wyświetlania rozkładów jazdy ZDiTM Szczecin

// Tablica adresów i nazw do wyświetlenia (dodaj tutaj ile chcesz)
// Każdy element ma właściwości 'url' i 'name'
const scheduleItems = [
    {
        url: "https://www.zditm.szczecin.pl/pl/pasazer/rozklady-jazdy/tablica/308",
        name: "Plac Rodła"
    },
    {
        url: "https://www.zditm.szczecin.pl/pl/pasazer/rozklady-jazdy/tablica/107",
        name: "Rondo Giedroycia"
    },
    {
        url: "https://www.zditm.szczecin.pl/pl/pasazer/rozklady-jazdy/tablica/75",
        name: "Plac Kościuszki"
    },
    // Używając tego samego schematu, dodaj kolejne przystanki
    // Wchodzisz na stronie na konkretny przystanek, który cię interesuje
    // klikasz "Reczywiste godziny odjazdów" w nowym oknie i kopjujesz adres strony
    // musi mieć końcówkę .../tablica/ID
]

// vvv Ta część kodu jest jeszcze w robocie vvv
//
// Create and run widget or show data in app
let widget = await createWidget()
if (config.runsInWidget) {
    Script.setWidget(widget)
    Script.complete()
} else {
    await displayDataInApp()
}

// Function to create a widget for home screen display
async function createWidget() {
    const widget = new ListWidget()
    widget.backgroundColor = new Color("#ffffff")

    const titleText = widget.addText("ZDITM Schedule")
    titleText.font = Font.boldSystemFont(16)
    titleText.centerAlignText()

    widget.addSpacer(8)

    const subtitleText = widget.addText("Run script to see full table")
    subtitleText.font = Font.systemFont(12)
    subtitleText.textColor = Color.gray()
    subtitleText.centerAlignText()

    // Add refresh date at the bottom
    widget.addSpacer()
    const updateText = widget.addDate(new Date())
    updateText.font = Font.systemFont(10)
    updateText.textColor = Color.gray()
    updateText.centerAlignText()

    // Set refresh interval
    widget.refreshAfterDate = new Date(Date.now() + 20000) // 20 seconds

    return widget
}
// ^^^ TODO: to jest w trakcie robienia - Widget ^^^


// Function to display data in app when script is run directly
async function displayDataInApp() {
    try {
        // If only one schedule in the array, show it directly
        if (scheduleItems.length === 1) {
            const webView = new WebView()
            await webView.loadURL(scheduleItems[0].url)
            await webView.present(true)
            return
        }

        // If multiple schedules, use the selection menu
        await showScheduleSelector(scheduleItems)

    } catch (error) {
        // Show error in alert
        let alert = new Alert()
        alert.title = "Error"
        alert.message = error.message
        await alert.present()
    }
}

// Function to display schedule selection menu
async function showScheduleSelector(items) {
    // Create a menu to select which schedule to view
    const alert = new Alert()
    alert.title = "ZDITM Schedule"
    alert.message = "Select a stop to view:"

    // Add each schedule as an option with custom name
    items.forEach((item) => {
        alert.addAction(item.name)
    })

    alert.addCancelAction("Cancel")

    // Show the menu and get selection
    const selection = await alert.present()

    // If canceled, return
    if (selection === -1) return

    // Show the selected schedule
    const webView = new WebView()
    await webView.loadURL(items[selection].url)
    await webView.present(true)
}