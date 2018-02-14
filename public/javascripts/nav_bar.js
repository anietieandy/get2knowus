function showGeneral() {
	var general_tab = document.getElementById("general_tab");
	general_tab.style.display = 'block';	

	var deep_dive_tab = document.getElementById("deep_dive_tab");
	deep_dive_tab.style.display = 'none';

	var cross_group_tab = document.getElementById("cross_group_tab");
	cross_group_tab.style.display = 'none';

	return false;
}

function showDeepDive() {
	var general_tab = document.getElementById("general_tab");
	general_tab.style.display = 'none';	

	var deep_dive_tab = document.getElementById("deep_dive_tab");
	deep_dive_tab.style.display = 'block';

	var cross_group_tab = document.getElementById("cross_group_tab");
	cross_group_tab.style.display = 'none';
	
	return false;
}

function showCrossGroup() {
	var general_tab = document.getElementById("general_tab");
	general_tab.style.display = 'none';	

	var deep_dive_tab = document.getElementById("deep_dive_tab");
	deep_dive_tab.style.display = 'none';

	var cross_group_tab = document.getElementById("cross_group_tab");
	cross_group_tab.style.display = 'block';
	
	return false;
}