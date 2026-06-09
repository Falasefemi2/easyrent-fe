"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icon
const icon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
});

interface MapViewProps {
	latitude: number;
	longitude: number;
	address: string;
	draggable?: boolean;
	onPositionChange?: (lat: number, lng: number) => void;
}

export default function MapView({
	latitude,
	longitude,
	address,
	draggable = false,
	onPositionChange,
}: MapViewProps) {
	return (
		<MapContainer
			center={[latitude, longitude]}
			zoom={15}
			style={{ height: "100%", width: "100%" }}
			scrollWheelZoom={false}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker
				position={[latitude, longitude]}
				icon={icon}
				draggable={draggable}
				eventHandlers={
					draggable && onPositionChange
						? {
								dragend: (e) => {
									const marker = e.target;
									const position = marker.getLatLng();
									onPositionChange(position.lat, position.lng);
								},
							}
						: {}
				}
			>
				<Popup>{address}</Popup>
			</Marker>
		</MapContainer>
	);
}
