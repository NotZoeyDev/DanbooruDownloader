/*
	Download pictures from Danbooru
*/

// Request, path, fs module
const request = require('request'), path = require('path'), fs = require('fs');

const folder = ""; // Output folder
const tags = ""; // Search query (Limited to 2 tags only, edit the search() function to add extra filters)
const searchURL = "https://danbooru.donmai.us/posts.json"; // API url for searching posts

var page = 0; // Current page
var images = []; // Array of images to download

/*
	Recursive function that downloads all the pictures in the images array, will stop one it's empty.
*/
function download() {
	// Make sure there's images left to download
	if(images.length > 0) {
		// Download the image
		request(images[0].large_file_url).pipe(fs.createWriteStream(path.normalize(folder + images[0].id + path.extname(images[0].large_file_url)))).on('close', () => {
			images.splice(0, 1); // Remove it from the images array
			console.log(images.length + " images left to download.");
			download(); // Recall the function
		}).on('error', () => { // In case of error
			console.log("Unable to download picture " + images[0].id);
			images.splice(0, 1);
			download();
		});
	} else { // We're done
		console.log("Done!");
	}
}

/*
	Recursive function that searchs Danbooru with the requested tag
*/
function search() {
	// Options used for Request
	let requestOptions = {
		url: searchURL + "?tags=" + tags + "&page=" + page,
		headers: {
			'Content-Type': "application/json"
		}
	};

	// Fetch the JSON
	request(requestOptions, (err, response, body) => {
		const results = JSON.parse(body); // Parse it

		// Check if there's any results
		if(results.length > 0) {
			console.log("Page #" + page);

			// Go through all the results
			for(res in results) {
				const tags = results[res].tag_string.split(" "); // Turn the tags into an array

				// Since Danbooru limits its search to 2 tags only, we use this to "filter" more tags.
				if(results[res].rating == "s" && tags.includes("1girl") && !tags.includes("guro") && !tags.includes("blood") && typeof results[res].large_file_url != "undefined") {
					console.log("Added picture #" + results[res].id + "!");
					images.push(results[res]); // Add it to the array
				}
			}

			// Add a page to the counter and recall the function
			page += 1;
			search();
		} else {
			download(); // Time to download everything
		}
	});
}

search(); // Starts searching using Danbooru's api