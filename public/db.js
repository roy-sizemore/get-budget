const indexDb =
  window.indexDb ||
  window.mozindexDb ||
  window.webkitindexDb ||
  window.msindexDb ||
  window.shimindexDb;

let db;
const request = indexDb.open("budget", 1);

// Create object store
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// If successful, run checkDatabase()
request.onsuccess = ({ target }) => {
  db = target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

// Error if unsucessful
request.onerror = function(event) {
  console.error(event.target.errorCode);
};

const saveRecord = (record) => {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");

  store.add(record);
};

// Checks DB on pending transaction and displays store
const checkDatabase = () => {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      }).then(response => {        
        return response.json();
      }).then(() => {
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    };
  };
};

window.addEventListener("online", checkDatabase);
