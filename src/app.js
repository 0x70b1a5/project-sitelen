document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const addElementButton = document.getElementById('add-element');
    
    let elementCounter = 0;
    let selectedElement = null;
    let draggedElement = null;
    let resizing = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let elementZIndex = 1;
    
    // Add a new element
    addElementButton.addEventListener('click', () => {
        const element = createNewElement();
        canvas.appendChild(element);
        selectElement(element);
    });
    
    // Create a new element
    function createNewElement() {
        elementCounter++;
        const element = document.createElement('div');
        element.className = 'element';
        element.id = `element-${elementCounter}`;
        element.dataset.id = elementCounter;
        element.style.left = '100px';
        element.style.top = '100px';
        element.style.width = '100px';
        element.style.height = '100px';
        element.style.zIndex = elementZIndex++;
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle se';
        element.appendChild(resizeHandle);
        
        setupElementEvents(element);
        return element;
    }
    
    // Set up event listeners for elements
    function setupElementEvents(element) {
        element.addEventListener('mousedown', onElementMouseDown);
        element.addEventListener('dblclick', () => {
            element.classList.toggle('dropzone');
        });
        
        const resizeHandle = element.querySelector('.resize-handle');
        resizeHandle.addEventListener('mousedown', onResizeHandleMouseDown);
    }
    
    // Handle mouse down on element
    function onElementMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) return;
        
        selectElement(e.currentTarget);
        draggedElement = e.currentTarget;
        
        const rect = draggedElement.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        e.stopPropagation();
    }
    
    // Handle mouse down on resize handle
    function onResizeHandleMouseDown(e) {
        resizing = true;
        selectedElement = e.target.parentElement;
        selectElement(selectedElement);
        
        // Store initial mouse position and element size to calculate relative changes
        const rect = selectedElement.getBoundingClientRect();
        selectedElement.initialWidth = rect.width;
        selectedElement.initialHeight = rect.height;
        selectedElement.initialMouseX = e.clientX;
        selectedElement.initialMouseY = e.clientY;
        
        e.stopPropagation();
    }
    
    // Select an element
    function selectElement(element) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = element;
        selectedElement.classList.add('selected');
        
        // Bring to front
        selectedElement.style.zIndex = elementZIndex++;
    }
    
    // Canvas events
    canvas.addEventListener('mousedown', (e) => {
        if (e.target === canvas) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
            }
        }
    });
    
    // Document events for dragging and resizing
    document.addEventListener('mousemove', (e) => {
        if (resizing && selectedElement) {
            // Calculate the change in mouse position from initial click
            const deltaX = e.clientX - selectedElement.initialMouseX;
            const deltaY = e.clientY - selectedElement.initialMouseY;
            
            // Add the change to the initial size
            const newWidth = Math.max(40, selectedElement.initialWidth + deltaX);
            const newHeight = Math.max(40, selectedElement.initialHeight + deltaY);
            
            selectedElement.style.width = `${newWidth}px`;
            selectedElement.style.height = `${newHeight}px`;
        } else if (draggedElement) {
            const rect = canvas.getBoundingClientRect();
            let left = e.clientX - rect.left - dragOffsetX;
            let top = e.clientY - rect.top - dragOffsetY;
            
            // Grid snapping (optional)
            left = Math.round(left / 20) * 20;
            top = Math.round(top / 20) * 20;
            
            draggedElement.style.left = `${left}px`;
            draggedElement.style.top = `${top}px`;
            
            checkDroppable(draggedElement, e);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (draggedElement) {
            finalizeDropping(draggedElement);
            draggedElement = null;
        }
        
        if (resizing && selectedElement) {
            // Check if the resized element is nested, and update parent sizes
            let parent = selectedElement.parentElement;
            if (parent !== canvas && parent.classList.contains('element')) {
                expandParentToFitChildren(parent);
            }
            resizing = false;
        } else {
            resizing = false;
        }
    });
    
    // Check if element is over a dropzone
    function checkDroppable(element, e) {
        const dropzones = document.querySelectorAll('.dropzone');
        let foundDropzone = false;
        
        dropzones.forEach(dropzone => {
            if (dropzone === element) return;
            
            const rect = dropzone.getBoundingClientRect();
            // Just check if upper left corner is inside dropzone
            if (
                e.clientX - dragOffsetX > rect.left &&
                e.clientX - dragOffsetX < rect.right &&
                e.clientY - dragOffsetY > rect.top &&
                e.clientY - dragOffsetY < rect.bottom
            ) {
                highlightDropzone(dropzone);
                foundDropzone = true;
            } else {
                unhighlightDropzone(dropzone);
            }
        });
        
        return foundDropzone;
    }
    
    // Highlight a dropzone
    function highlightDropzone(dropzone) {
        dropzone.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    }
    
    // Unhighlight a dropzone
    function unhighlightDropzone(dropzone) {
        dropzone.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    }
    
    // Finalize dropping an element
    function finalizeDropping(element) {
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
                nestElement(element, dropzone);
            }
            
            unhighlightDropzone(dropzone);
        });
    }
    
    // Nest an element inside another
    function nestElement(child, parent) {
        // Get position relative to parent
        const parentRect = parent.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();
        
        const relativeLeft = childRect.left - parentRect.left;
        const relativeTop = childRect.top - parentRect.top;
        
        // Remove from canvas and add to parent
        if (child.parentElement === canvas) {
            canvas.removeChild(child);
        } else {
            child.parentElement.removeChild(child);
        }
        parent.appendChild(child);
        
        // Update position to be relative to new parent
        child.style.position = 'absolute';
        child.style.left = `${relativeLeft}px`;
        child.style.top = `${relativeTop}px`;
        
        // Check if parent needs to expand to fit the child
        expandParentToFitChildren(parent);
    }
    
    // Expand parent to fit all children
    function expandParentToFitChildren(parent) {
        const children = Array.from(parent.querySelectorAll('.element'));
        if (children.length === 0) return;
        
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = 0;
        let maxBottom = 0;
        
        // Find the bounds of all children
        children.forEach(child => {
            const left = parseInt(child.style.left) || 0;
            const top = parseInt(child.style.top) || 0;
            const width = parseInt(child.style.width) || 0;
            const height = parseInt(child.style.height) || 0;
            
            minLeft = Math.min(minLeft, left);
            minTop = Math.min(minTop, top);
            maxRight = Math.max(maxRight, left + width);
            maxBottom = Math.max(maxBottom, top + height);
        });
        
        // Add padding
        const padding = 20;
        
        // Set parent size to contain all children plus padding
        parent.style.width = `${maxRight + padding}px`;
        parent.style.height = `${maxBottom + padding}px`;
        
        // If this parent is nested, recursively expand its parent too
        if (parent.parentElement !== canvas && parent.parentElement.classList.contains('element')) {
            expandParentToFitChildren(parent.parentElement);
        }
    }
});