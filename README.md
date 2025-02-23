# Text Search

A simple demo showcasing semantic similarity for text search.

## Getting Started

1.  **Install Dependencies:**

```bash
npm install
```

2.  **Run the Search Script:**

```bash
./text-search.js <filename> "<query>"
```

* `<filename>`: The path to the text file you want to search. The file should contain one or more lines of text.
* `"<query>"`: The search query, enclosed in double quotes.

## Example Usage

To find the most relevant lines in `solar-system.txt` related to "largest planet":

```bash
./text-search.js solar-system.txt "largest planet"
```

This will output the top 3 most similar lines from `solar-system.txt` based on the provided query.
