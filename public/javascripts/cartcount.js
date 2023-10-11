document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.minus-cart');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const productId = button.getAttribute('data-minusid');

  
        fetch(/cart/quantityMinus/${productId} , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // You can include any data you need in the request body
          body: JSON.stringify({ productId}),
        })
          .then((response) => {
            response.json()
             location.reload();
       
          })
         
          .catch((error) => {
            console.error('Error adding product to cart:', error);
          });
      });
    });
  });









document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.Add-cart');
    addToCartButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const productId = button.getAttribute('data-Addid');

  
        fetch(/cart/quantityAdd/${productId} , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // You can include any data you need in the request body
          body: JSON.stringify({ productId}),
        })
          .then((response) => {
            response.json()
              location.reload();
       
       
          })
         
          .catch((error) => {
            console.error('Error adding product to cart:', error);
          });
      });
    });
  });