function doTheBlue(obj, query) {
  console.log("made it");
  var list_elem = document.getElementById("blue-" + obj.id);
  var to_hide = document.getElementById(obj.id);
  to_hide.style.display = 'none';
  $.post("/blueMixSingle", {
		query: query,
	}, function(data, status) {
		if (status == "success") {
			console.log(data);
			list_elem.insertAdjacentHTML('beforeend', 
    		'<div id="hiVivian"> Results: ' +  data  + '</div>');
		} else {
			console.log("Something broke");
			console.log("Error was: " + status);
		}
	});
  return false; 
}