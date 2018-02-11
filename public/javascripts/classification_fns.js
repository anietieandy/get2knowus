function postClassification(obj, query, query_type) {
	var card_elem = document.getElementById("card-" + obj.id);
	card_elem.style.display = 'none';
	var text_obj = card_elem.getElementsByTagName('p');
	var post_data = text_obj[0].innerText;
	var post_author = text_obj[1].innerText;
	$.post("/api/add_classification", {
		query: query,
		post: post_data,
		user: post_author,
		valid: (query_type == 1)
	}, function(data, status) {
		if (status == "success") {
			console.log("Successfully added new classification");
		} else {
			console.log("Something broke in adding new classification...");
			console.log("Error was: " + status);
		}
	});
	return false;
}