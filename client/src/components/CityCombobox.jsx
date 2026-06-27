import { useState, useRef, useEffect } from "react";
import { ISRAELI_CITIES } from "../data/israeliCities";

export default function CityCombobox({ value, onChange, placeholder = "הקלד עיר..." }) {
  const [inputText,   setInputText]   = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open,        setOpen]        = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef      = useRef(null);

  useEffect(() => {
    setInputText(value || "");
  }, [value]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleInput = (e) => {
    const text = e.target.value;
    setInputText(text);
    onChange("");
    setActiveIndex(-1);
    if (!text) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const filtered = ISRAELI_CITIES.filter((c) => c.includes(text)).slice(0, 8);
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
  };

  const handleSelect = (city) => {
    setInputText(city);
    onChange(city);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && inputText) {
        const filtered = ISRAELI_CITIES.filter((c) => c.includes(inputText)).slice(0, 8);
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
        setActiveIndex(filtered.length > 0 ? 0 : -1);
      } else if (open && suggestions.length > 0) {
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && suggestions.length > 0) {
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0) {
        handleSelect(suggestions[activeIndex]);
      } else if (open && suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (ISRAELI_CITIES.includes(inputText)) {
        onChange(inputText);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (ISRAELI_CITIES.includes(inputText)) {
        onChange(inputText);
      } else {
        setInputText("");
        onChange("");
      }
      setOpen(false);
      setActiveIndex(-1);
    }, 150);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1 relative">
      <label className="text-sm text-rw-sub text-right">עיר</label>
      <input
        type="text"
        value={inputText}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="border border-rw-border rounded-xl px-4 py-3
                   text-sm text-right outline-none bg-rw-input focus:border-rw-btn"
      />
      {open && (
        <ul ref={listRef}
          className="absolute top-full mt-1 w-full bg-rw-card border border-rw-border
                     rounded-xl shadow-md z-50 max-h-52 overflow-y-auto">
          {suggestions.map((city, index) => (
            <li
              key={city}
              onMouseDown={() => handleSelect(city)}
              className={`px-4 py-3 text-sm text-right cursor-pointer
                ${index === activeIndex ? "bg-rw-input" : "hover:bg-rw-input"}`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
