This is a jekyll site that will be rendered and hosted by github's free hosting service

The purpose of this jekyll site will be a sort of personal food review blog. However, the purpose is not for people to read my reviews, it is so I can remember restaurants that I have been to and that I liked. So, it should have a very easy and simple way to add places I've been to and my thoughts on them. There does not need to be a rating system, if it is present in this site then it is a restaurant that I liked. 

when someone goes to the site there should be a list of restaurants on the left and a map on the right (open street maps preferred). There should be filtering for price and cuisine type. 

Since this is a jekyll site, all the content needs to be static. There should be a json file containing a list of restaurants. the restaurant object should have cuisine type, description, address (or coordinates, something to make osm mapping possible), name, and a list of times I've gone. In the list of times I've gone, there should just be cost and number of people. eg, [{"cost":16.32,"people":1},{"cost":32.32,"people":2}]. The static site should read this file and display all the restaurants in it. The price shown in the website should be the average of all the visits calculated for "one person" eg sum(cost)/sum(people)

Filtering the list of restaurants should also filter the map, and clicking on one of the restaurants on the map should scroll the list to it.

---

## Clarifications & Design Decisions

- **Price filtering**: Two-sided slider filtering by per-person average cost (`sum(cost) / sum(people)`)
- **Location storage**: Coordinates (`lat`, `lng`) stored directly in the JSON — no geocoding needed
- **Theme**: Follows system dark/light preference (CSS `prefers-color-scheme`)
- **Layout**: Single page — list and map always visible side-by-side; responsive/mobile-friendly (stacks vertically on small screens)
- **Map**: OpenStreetMap via Leaflet.js; markers show a popup with restaurant name/info
- **Clicking a map marker**: Opens popup on map + scrolls list to that restaurant + highlights it
- **Clicking a list item**: Opens the corresponding map marker popup + pans map to it

