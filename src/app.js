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
            const rect = canvas.getBoundingClientRect();
            const width = Math.max(40, e.clientX - rect.left - selectedElement.offsetLeft);
            const height = Math.max(40, e.clientY - rect.top - selectedElement.offsetTop);
            
            selectedElement.style.width = `${width}px`;
            selectedElement.style.height = `${height}px`;
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
        resizing = false;
    });
    
    // Check if element is over a dropzone
    function checkDroppable(element, e) {
        const dropzones = document.querySelectorAll('.dropzone');
        let foundDropzone = false;
        
        dropzones.forEach(dropzone => {
            if (dropzone === element) return;
            
            const rect = dropzone.getBoundingClientRect();
            if (
                e.clientX > rect.left &&
                e.clientX < rect.right &&
                e.clientY > rect.top &&
                e.clientY < rect.bottom
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
        
        dropzones.forEach(dropzone => {
            if (dropzone === element) return;
            
            const dropRect = dropzone.getBoundingClientRect();
            const elemRect = element.getBoundingClientRect();
            
            if (
                elemRect.left > dropRect.left &&
                elemRect.right < dropRect.right &&
                elemRect.top > dropRect.top &&
                elemRect.bottom < dropRect.bottom
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
        canvas.removeChild(child);
        parent.appendChild(child);
        
        // Update position to be relative to new parent
        child.style.position = 'absolute';
        child.style.left = `${relativeLeft}px`;
        child.style.top = `${relativeTop}px`;
    }
});