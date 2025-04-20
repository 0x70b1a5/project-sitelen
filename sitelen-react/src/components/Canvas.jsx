import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import Element from './Element';

const Canvas = forwardRef((props, ref) => {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const elementCounter = useRef(0);

  // Expose addElement method to parent component through ref
  useImperativeHandle(ref, () => ({
    addElement: () => {
      const newElement = {
        id: ++elementCounter.current,
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        isDropzone: false,
        children: []
      };
      
      setElements(prev => [...prev, newElement]);
      setSelectedId(newElement.id);
    }
  }));

  const selectElement = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const updateElement = useCallback((id, changes) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...changes } : el)
    );
  }, []);

  const onCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  }, []);

  const toggleDropzone = useCallback((id) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, isDropzone: !el.isDropzone } : el)
    );
  }, []);

  const nestElement = useCallback((childId, parentId) => {
    setElements(prev => {
      // Find the child element
      const childEl = prev.find(el => el.id === childId);
      if (!childEl) return prev;

      // Create a new array without the child
      const newElements = prev.filter(el => el.id !== childId);
      
      // Add the child to the parent's children array
      return newElements.map(el => {
        if (el.id === parentId) {
          return {
            ...el,
            children: [...el.children, childEl]
          };
        }
        return el;
      });
    });
  }, []);

  return (
    <div 
      ref={canvasRef}
      className="canvas" 
      onClick={onCanvasClick}
    >
      {elements.map(element => (
        <Element
          key={element.id}
          element={element}
          isSelected={selectedId === element.id}
          onSelect={() => selectElement(element.id)}
          onUpdate={(changes) => updateElement(element.id, changes)}
          onToggleDropzone={() => toggleDropzone(element.id)}
          onNest={nestElement}
          parentIsCanvas={true}
        />
      ))}
    </div>
  );
});

export default Canvas;