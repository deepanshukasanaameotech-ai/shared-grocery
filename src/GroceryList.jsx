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
    <div style={{ maxWidth: 650, margin: "40px auto", padding: 24, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.2)", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header with Logo */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src="https://cdn-icons-png.flaticon.com/512/135/135763.png" alt="Logo" width={80} style={{ marginBottom: 10 }} />
        <h2>🛒 Shared Grocery Shelf</h2>
        <p style={{ color: "#555" }}>Add, categorize, and track groceries with your group!</p>
      </div>

      {/* Input area */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <input type="text" placeholder="Item name" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }} />
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: 80, padding: "10px", borderRadius: 8, border: "1px solid #ccc" }} />
        <input type="text" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 80, padding: "10px", borderRadius: 8, border: "1px solid #ccc" }} />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 100, padding: "10px", borderRadius: 8, border: "1px solid #ccc" }} />
        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ borderRadius: 8, padding: "10px", fontSize: 16 }}>
          {Object.keys(categories).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
        <input type="text" placeholder="Or new category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }} />
        <button onClick={addItem} style={{ padding: "10px 16px", borderRadius: 8, backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Add</button>
      </div>

      {/* Empty state */}
      {items.length === 0 && <p style={{ textAlign: "center", color: "#777", marginTop: 40, fontSize: 16 }}>Your grocery shelf is empty 🛒 Add some items above!</p>}

      {/* Grocery list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} style={{ listStyle: "none", padding: 0 }}>
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: 10, borderRadius: 8, backgroundColor: categories[item.category]?.color || "#f9f9f9", cursor: "grab", ...provided.draggableProps.style }}>
                      {/* Item Info */}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id, item.done)} />
                        {editingFields.id === item.id ? (
                          <>
                            <input type="text" value={editingFields.name} onChange={(e) => setEditingFields((prev) => ({ ...prev, name: e.target.value }))} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #ccc" }} />
                            <input type="number" min={1} value={editingFields.quantity} onChange={(e) => setEditingFields((prev) => ({ ...prev, quantity: Number(e.target.value) }))} style={{ width: 60, padding: "4px 6px", borderRadius: 4, border: "1px solid #ccc" }} />
                            <input type="text" value={editingFields.unit} onChange={(e) => setEditingFields((prev) => ({ ...prev, unit: e.target.value }))} style={{ width: 60, padding: "4px 6px", borderRadius: 4, border: "1px solid #ccc" }} />
                            <input type="number" value={editingFields.price} onChange={(e) => setEditingFields((prev) => ({ ...prev, price: e.target.value }))} style={{ width: 80, padding: "4px 6px", borderRadius: 4, border: "1px solid #ccc" }} />
                            <input type="text" value={editingFields.notes} onChange={(e) => setEditingFields((prev) => ({ ...prev, notes: e.target.value }))} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #ccc" }} />
                          </>
                        ) : (
                          <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "#777" : "#333", fontSize: 16 }}>
                            {categories[item.category]?.icon} {item.name} x{item.quantity} {item.unit} Rupees - {item.price} <em style={{ fontSize: 12, color: "#555" }}>({item.category}) {item.notes}</em>
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {editingFields.id === item.id ? (
                          <button onClick={saveEdit} style={{ cursor: "pointer" }}>💾</button>
                        ) : (
                          <button onClick={() => startEditing(item)} style={{ cursor: "pointer" }}>✏️</button>
                        )}
                        <button onClick={() => deleteItem(item.id)} style={{ cursor: "pointer" }}>🗑️</button>
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
