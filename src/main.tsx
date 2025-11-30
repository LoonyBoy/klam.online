
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router-dom";
  import App from "./App.tsx";
  import ErrorBoundary from "./components/ErrorBoundary.tsx";
  import "./index.css";

  // Патч для обхода конфликта с антивирусами (Kaspersky, Norton и др.)
  // Они внедряют свои скрипты в DOM, что вызывает ошибки removeChild в React
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      console.warn('Suppressed removeChild error - node not a child (likely antivirus injection)');
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn('Suppressed insertBefore error - reference node not a child (likely antivirus injection)');
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  // Глобальный обработчик ошибок для подавления оставшихся ошибок
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('removeChild') || 
        event.error?.message?.includes('insertBefore') ||
        event.error?.name === 'NotFoundError') {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Suppressed global DOM error (likely antivirus)');
      return false;
    }
  });

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  );
  