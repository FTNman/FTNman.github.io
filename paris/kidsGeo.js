const fgpgeo = {
	kidsGeo: {
	"type": "FeatureCollection",
	"features": [
		{
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [-75.1312, 39.9815]
			},
			"properties": {
				"name": "Sarah & David",
				"address": "2070 E Susquehanna Ave, Philadelphia, PA, 19125",
				"city": "Philadelphia",
				"state": "PA",
				"zipcode": "19125"
			}
		},
		{
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [-75.1391, 39.9714]
			},
			"properties": {
				"name": "Frank & Kathy",
				"address": "1317 N 2nd St, Philadelphia, PA, 19122",
				"city": "Philadelphia",
				"state": "PA",
				"zipcode": "19122"
			}
		}
	]
},
bbox2geojson: function([y1, y2, x1, x2]) {
	return {
		type: "Polygon",
		coordinates: [[
			[x1, y1],
			[x2, y1],
			[x2, y2],
			[x1, y2],
			[x1, y1]
		]]
	};
}
};