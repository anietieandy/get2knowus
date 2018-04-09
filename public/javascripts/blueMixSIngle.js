function doTheBlue(obj, query) {
  console.log("made it");
  var list_elem = document.getElementById("blue-" + obj.id);
  var to_hide = document.getElementById(obj.id);
  to_hide.style.display = 'none';
  list_elem.insertAdjacentHTML('beforeend', 
    '<div id="hiVivian"> Results: do stuff to - ' +  query  + '</div>');
  console.log(query);
  return false;
}