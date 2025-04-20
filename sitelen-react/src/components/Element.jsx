import { useState, useRef, useEffect } from 'react';

const Element = ({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onToggleDropzone, 
  onNest, 
  parentIsCanvas = false,
  parentRect = null
}) => {
  const {
    id,
    left,
    top,
    width,
    height,
    isDropzone,
    children = []
  } = element;

  const elementRef = useRef(null);
  const resizeHandleRef = useRef(null);
  
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialResize, setInitialResize] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  // Handle element mouse down
  const handleMouseDown = (e) => {
    if (e.target === resizeHandleRef.current) return;
    
    onSelect();
    setDragging(true);
    
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.stopPropagation();
  };

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e) => {
    onSelect();
    setResizing(true);
    
    const rect = elementRef.current.getBoundingClientRect();
    setInitialResize({
      width: rect.width,
      height: rect.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
    
    e.stopPropagation();
  };

  // Handle double click to toggle dropzone
  const handleDoubleClick = (e) => {
    onToggleDropzone();
    e.stopPropagation();
  };

  // Mouse move handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (resizing) {
        // Calculate resize based on mouse movement
        const deltaX = e.clientX - initialResize.mouseX;
        const deltaY = e.clientY - initialResize.mouseY;
        
        const newWidth = Math.max(40, initialResize.width + deltaX);
        const newHeight = Math.max(40, initialResize.height + deltaY);
        
        onUpdate({ width: newWidth, height: newHeight });
      } 
      else if (dragging) {
        let container = parentIsCanvas ? 
          document.querySelector('.canvas').getBoundingClientRect() : 
          parentRect;
        
        if (!container && !parentIsCanvas) {
          container = elementRef.current.parentElement.getBoundingClientRect();
        }
        
        // Calculate new position based on mouse movement and grid snapping
        let newLeft = e.clientX - container.left - dragOffset.x;
        let newTop = e.clientY - container.top - dragOffset.y;
        
        // Optional grid snapping
        newLeft = Math.round(newLeft / 20) * 20;
        newTop = Math.round(newTop / 20) * 20;
        
        onUpdate({ left: newLeft, top: newTop });
        
        // Check for dropzones
        checkDroppable(e, elementRef.current);
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        finalizeDropping(elementRef.current);
      }
      
      if (resizing) {
        setResizing(false);
      }
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, dragOffset, initialResize, onUpdate, parentIsCanvas, parentRect]);

  // Check if element is over a dropzone
  const checkDroppable = (e, element) => {
    const dropzones = document.querySelectorAll('.dropzone');
    
    dropzones.forEach(dropzone => {
      if (dropzone === element) return;
      
      const rect = dropzone.getBoundingClientRect();
      // Just check if upper left corner is inside dropzone
      if (
        e.clientX - dragOffset.x > rect.left &&
        e.clientX - dragOffset.x < rect.right &&
        e.clientY - dragOffset.y > rect.top &&
        e.clientY - dragOffset.y < rect.bottom
      ) {
        highlightDropzone(dropzone);
      } else {
        unhighlightDropzone(dropzone);
      }
    });
  };

  // Highlight a dropzone
  const highlightDropzone = (dropzone) => {
    dropzone.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
  };

  // Unhighlight a dropzone
  const unhighlightDropzone = (dropzone) => {
    dropzone.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
  };

  // Finalize dropping an element
  const finalizeDropping = (element) => {
    const dropzones = document.querySelectorAll('.dropzone');
    const elemRect = element.getBoundingClientRect();
    
    dropzones.forEach(dropzone => {
      if (dropzone === element) return;
      
      const dropRect = dropzone.getBoundingClientRect();
      
      // Check if upper left corner of element is inside dropzone
      if (
        elemRect.left > dropRect.left &&
        elemRect.left < dropRect.right &&
        elemRect.top > dropRect.top &&
        elemRect.top < dropRect.bottom
      ) {
        // Get the ID from the dropzone's data attribute
        const dropzoneId = parseInt(dropzone.dataset.id);
        onNest(id, dropzoneId);
      }
      
      unhighlightDropzone(dropzone);
    });
  };

  return (
    <div
      ref={elementRef}
      className={`element ${isSelected ? 'selected' : ''} ${isDropzone ? 'dropzone' : ''}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      data-id={id}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Resize handle */}
      <div
        ref={resizeHandleRef}
        className="resize-handle se"
        onMouseDown={handleResizeMouseDown}
      />
      
      {/* Render child elements */}
      {children.map(child => (
        <Element
          key={child.id}
          element={child}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onToggleDropzone={onToggleDropzone}
          onNest={onNest}
          parentIsCanvas={false}
          parentRect={elementRef.current?.getBoundingClientRect()}
        />
      ))}
    </div>
  );
};

export default Element;