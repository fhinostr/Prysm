import sys
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl

class WebBrowser(QWebEngineView):
    def __init__(self):
        super().__init__()
        self.page().profile().setPersistentCookiesPolicy(self.page().profile().PersistentCookiesPolicy.NoPersistentCookies)
        self.loadFinished.connect(self.on_load_finished)

    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        print(f"CONSOLE [{level}]: {message} at {sourceID}:{lineNumber}")

    def on_load_finished(self, ok):
        if not ok:
            print("Failed to load page")
        else:
            print("Page loaded successfully")
        QApplication.quit()

app = QApplication(sys.argv)
browser = WebBrowser()
browser.load(QUrl("file:///Users/flaviohinostroza/Desktop/TEST/LMS/aba-data/bcba.html"))
app.exec()
