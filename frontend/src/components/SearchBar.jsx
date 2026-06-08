import React from "react";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Найти фильм (например, Интерстеллар)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.input}
      />
    </div>
  );
};

const styles = {
  container: {
    marginBottom: "30px",
    display: "flex",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    maxWidth: "600px",
    padding: "15px 25px",
    borderRadius: "30px",
    border: "2px solid #333",
    backgroundColor: "#222",
    color: "white",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
};

export default SearchBar;
