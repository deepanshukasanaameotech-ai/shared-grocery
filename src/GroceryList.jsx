import { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Predefined categories with color and optional emoji icon
const defaultCategories = {
  Dairy: { color: "#FFECB3", icon: "🥛" },
  Veggies: { color: "#C8E6C9", icon: "🥦" },
  Snacks: { color: "#FFE0B2", icon: "🍪" },
  Others: { color: "#E1BEE7", icon: "🛍️" },
};

export default function GroceryList() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Dairy");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState(defaultCategories);
  const [editingId, setEditingId] = useState(null);
  const [editingFields, setEditingFields] = useState({});

  const itemsRef = collection(db, "groups", "myFlat", "items");

  // Firestore real-time listener
  useEffect(() => {
    const q = query(itemsRef, orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Add new item
  const addItem = async () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;

    let finalCategory = category;
    if (customCategory.trim()) {
      finalCategory = customCategory.trim();
      if (!categories[finalCategory]) {
        setCategories((prev) => ({
          ...prev,
          [finalCategory]: { color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`, icon: "🛒" },
        }));
      }
      setCustomCategory("");
    }

    const maxOrder = items.length ? Math.max(...items.map((i) => i.order ?? 0)) : -1;

    await addDoc(itemsRef, {
      name: trimmed,
      quantity,
      unit,
      price,
      notes,
      category: finalCategory,
      done: false,
      order: maxOrder + 1,
    });

    setNewItem("");
    setQuantity(1);
    setUnit("pcs");
    setPrice("");
    setNotes("");
  };

  // Toggle done
  const toggleDone = async (id, done) => {
    await updateDoc(doc(db, "groups", "myFlat", "items", id), { done: !done });
  };

  // Drag & drop persistence
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);

    for (let index = 0; index < reordered.length; index++) {
      await updateDoc(doc(db, "groups", "myFlat", "items", reordered[index].id), { order: index });
    }
  };

  // Start editing
  const startEditing = (item) => setEditingFields({ ...item, id: item.id });

  // Save edit
  const saveEdit = async () => {
    const { id, name, quantity, unit, price, notes } = editingFields;
    if (!name.trim()) return;
    await updateDoc(doc(db, "groups", "myFlat", "items", id), { name, quantity, unit, price, notes });
    setEditingFields({});
  };

  // Delete item
  const deleteItem = async (id) => await deleteDoc(doc(db, "groups", "myFlat", "items", id));

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 24,
        borderRadius: 20,
        fontFamily: "'Inter', sans-serif",
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        border: "1px solid rgba(255,255,255,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 25 }}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/135/135763.png"
          alt="Logo"
          width={90}
          style={{
            marginBottom: 12,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
          }}
        />
        <h2 style={{ fontSize: 28, margin: 0 }}>🛒 Shared Grocery Shelf</h2>
        <p style={{ color: "#444", fontSize: 15 }}>
          Manage groceries with ease and vibes ✨
        </p>
      </div>

      {/* Input Box – Floating Card */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
          boxShadow: "0 6px 15px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="text"
          placeholder="🍎 Add item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 16,
          }}
        />
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{
            width: 80,
            padding: "12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <input
          type="text"
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{
            width: 80,
            padding: "12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <input
          type="number"
          placeholder="₹ price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            width: 110,
            padding: "12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            borderRadius: 10,
            padding: "12px",
            fontSize: 16,
            border: "1px solid #ddd",
          }}
        >
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={addItem}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            background:
              "linear-gradient(135deg, #6EE7B7 0%, #3B82F6 90%)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            border: "none",
            transition: "0.2s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          ➕ Add
        </button>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: "#888",
            marginTop: 40,
            fontSize: 16,
          }}
        >
          Your grocery shelf is empty. Add something 👀✨
        </p>
      )}

      {/* List */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ listStyle: "none", padding: 0 }}
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        marginBottom: 12,
                        borderRadius: 16,
                        background: categories[item.category]?.color,
                        boxShadow:
                          "0 8px 20px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)",
                        cursor: "grab",
                        transition: "transform 0.15s",
                        ...provided.draggableProps.style,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      {/* Left */}
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleDone(item.id, item.done)}
                        />

                        <span
                          style={{
                            fontSize: 17,
                            color: item.done ? "#777" : "#222",
                            textDecoration: item.done
                              ? "line-through"
                              : "none",
                            display: "flex",
                            gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 22 }}>
                            {categories[item.category]?.icon}
                          </span>
                          {item.name}
                          <span style={{ opacity: 0.7 }}>
                            ×{item.quantity} {item.unit} — ₹{item.price}
                          </span>
                          <em
                            style={{
                              fontSize: 12,
                              marginLeft: 6,
                              opacity: 0.6,
                            }}
                          >
                            {item.notes}
                          </em>
                        </span>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => startEditing(item)}
                          style={{
                            fontSize: 20,
                            cursor: "pointer",
                            background: "transparent",
                            border: "none",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            fontSize: 20,
                            cursor: "pointer",
                            background: "transparent",
                            border: "none",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}