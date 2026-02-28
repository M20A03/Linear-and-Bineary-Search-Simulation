import tkinter as tk
from tkinter import messagebox
import time

class SearchVisualizer:
    def __init__(self, root):
        self.root = root
        self.root.title("Linear & Binary Search Visualizer")
        self.root.geometry("600x500")

        # Input frame
        self.input_frame = tk.Frame(root)
        self.input_frame.pack(pady=10)

        tk.Label(self.input_frame, text="Enter numbers (comma-separated):").pack()
        self.entry = tk.Entry(self.input_frame, width=40)
        self.entry.pack()

        # Algorithm selection
        self.algo_frame = tk.Frame(root)
        self.algo_frame.pack(pady=5)

        self.algo_var = tk.StringVar(value="Linear")
        tk.Radiobutton(self.algo_frame, text="Linear Search", variable=self.algo_var, value="Linear").pack(side=tk.LEFT)
        tk.Radiobutton(self.algo_frame, text="Binary Search", variable=self.algo_var, value="Binary").pack(side=tk.LEFT)

        # Search button
        self.search_btn = tk.Button(root, text="Start Search", command=self.start_search)
        self.search_btn.pack(pady=10)

        # Canvas for visualization
        self.canvas = tk.Canvas(root, width=500, height=200, bg="white")
        self.canvas.pack(pady=10)

        # Status label
        self.status_label = tk.Label(root, text="", fg="blue")
        self.status_label.pack()

        # Data storage
        self.data = []
        self.target = None
        self.comparisons = 0

    def start_search(self):
        try:
            text = self.entry.get().strip()
            self.data = list(map(int, text.split(',')))
            self.target = int(self.entry.get().split(',')[-1])  # Use last number as target
            self.comparisons = 0
            self.status_label.config(text="Starting search...")
            self.canvas.delete("all")

            # Draw initial list
            self.draw_list(self.data)

            # Run selected algorithm
            if self.algo_var.get() == "Linear":
                self.linear_search()
            else:
                if not self.is_sorted(self.data):
                    messagebox.showwarning("Warning", "Binary Search requires a sorted list. Sorting now...")
                    self.data.sort()
                    self.draw_list(self.data)
                self.binary_search()

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def linear_search(self):
        for i, val in enumerate(self.data):
            self.comparisons += 1
            self.canvas.delete("highlight")
            self.canvas.create_rectangle(50 + i*40, 50, 50 + (i+1)*40, 150, fill="yellow", tags="highlight")
            self.canvas.create_text(50 + i*40 + 20, 100, text=str(val), font=("Arial", 12))
            self.status_label.config(text=f"Checking index {i}, value: {val}")
            self.root.update()
            time.sleep(0.5)

            if val == self.target:
                self.status_label.config(text=f"Found {self.target} at index {i}! Total comparisons: {self.comparisons}")
                return

        self.status_label.config(text=f"{self.target} not found. Total comparisons: {self.comparisons}")

    def binary_search(self):
        left, right = 0, len(self.data) - 1
        self.status_label.config(text="Starting Binary Search...")

        while left <= right:
            mid = (left + right) // 2
            self.comparisons += 1

            self.canvas.delete("highlight")
            self.canvas.create_rectangle(50 + mid*40, 50, 50 + (mid+1)*40, 150, fill="green", tags="highlight")
            self.canvas.create_text(50 + mid*40 + 20, 100, text=str(self.data[mid]), font=("Arial", 12, "bold"))
            self.status_label.config(text=f"Comparing with mid={mid}, value={self.data[mid]}")
            self.root.update()
            time.sleep(0.8)

            if self.data[mid] == self.target:
                self.status_label.config(text=f"Found {self.target} at index {mid}! Total comparisons: {self.comparisons}")
                return
            elif self.data[mid] < self.target:
                left = mid + 1
            else:
                right = mid - 1

        self.status_label.config(text=f"{self.target} not found. Total comparisons: {self.comparisons}")

    def draw_list(self, arr):
        self.canvas.delete("all")
        for i, val in enumerate(arr):
            self.canvas.create_rectangle(50 + i*40, 50, 50 + (i+1)*40, 150, fill="lightblue")
            self.canvas.create_text(50 + i*40 + 20, 100, text=str(val), font=("Arial", 12))

    def is_sorted(self, arr):
        return all(arr[i] <= arr[i+1] for i in range(len(arr)-1))

# Run the app
if __name__ == "__main__":
    root = tk.Tk()
    app = SearchVisualizer(root)
    root.mainloop()   