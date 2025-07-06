'use client';

import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { useEffect, useRef, useState, ReactElement } from 'react';

// Datos de los nodos
const nodosCongata = [
    { id: 'Mirador', nom: 'Mirador de Congata', lat: -16.444250, lng: -71.618880 },
    { id: 'Entrada', nom: 'Entrada a Congata', lat: -16.453330, lng: -71.610560 },
    { id: 'Salida', nom: 'Salida de Congata', lat: -16.455790, lng: -71.618560 },
];

// Extender el tipo Window para incluir google
declare global {
    interface Window {
        google: typeof google;
    }
}

// Componente del mapa
interface MapProps {
    center: google.maps.LatLngLiteral;
    zoom: number;
    markers: typeof nodosCongata;
}

function MapComponent({ center, zoom, markers }: MapProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map>();

    useEffect(() => {
        if (ref.current && !map) {
            const newMap = new window.google.maps.Map(ref.current, {
                center,
                zoom,
                mapTypeId: 'roadmap',
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'on' }]
                    }
                ]
            });
            setMap(newMap);
        }
    }, [ref, map, center, zoom]);

    useEffect(() => {
        if (map) {
            // Limpiar marcadores anteriores
            markers.forEach((nodo) => {
                const marker = new window.google.maps.Marker({
                    position: { lat: nodo.lat, lng: nodo.lng },
                    map: map,
                    title: nodo.nom,
                    animation: window.google.maps.Animation.DROP,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                    }
                });

                // InfoWindow para cada marcador
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding-left: 10px; padding-right: 10px; padding-bottom: 10px; min-width: 200px;">
                            <h3 style="color: #1e40af; font-weight: bold; margin: 0 0 8px 0; font-size: 16px;">
                                ${nodo.nom}
                            </h3>
                            <p style="margin: 4px 0; color: #666; font-size: 14px;">
                                <strong>ID:</strong> ${nodo.id}
                            </p>
                            <p style="margin: 4px 0; color: #666; font-size: 14px;">
                                <strong>Coordenadas:</strong><br/>
                                Lat: ${nodo.lat}<br/>
                                Lng: ${nodo.lng}
                            </p>
                            <div style="margin-top: 8px; padding: 6px; background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 4px;">
                                <p style="margin: 0; color: #0369a1; font-size: 12px; font-weight: 500;">
                                    🟢 Sensor Activo
                                </p>
                            </div>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
            });
        }
    }, [map, markers]);

    return <div ref={ref} style={{ width: '100%', height: '400px' }} className="sm:!h-[500px] lg:!h-[600px]" />;
}

// Componente de loading
const render = (status: Status): ReactElement => {
    switch (status) {
        case Status.LOADING:
            return (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl border border-blue-200">
                    <div className="text-center px-4">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-blue-700 font-medium text-sm sm:text-base">Cargando Google Maps...</p>
                    </div>
                </div>
            );
        case Status.FAILURE:
            return (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl border border-red-200">
                    <div className="text-center text-red-700 px-4">
                        <p className="font-semibold text-sm sm:text-base">Error al cargar Google Maps</p>
                        <p className="text-xs sm:text-sm mt-2">Verifica tu API Key de Google Maps</p>
                    </div>
                </div>
            );
        default:
            return <div></div>;
    }
};

export default function Map() {
    // Calcular el centro del mapa
    const centerLat = nodosCongata.reduce((sum, node) => sum + node.lat, 0) / nodosCongata.length;
    const centerLng = nodosCongata.reduce((sum, node) => sum + node.lng, 0) / nodosCongata.length;

    const center = { lat: centerLat, lng: centerLng };

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-white">
            <div className="container mx-auto p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                        Mapa de Sensores - Congata
                    </h1>
                    <p className="text-sm sm:text-base text-gray-700">
                        Ubicación de los nodos de monitoreo de calidad del aire - Powered by Google Maps
                    </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden mb-4 sm:mb-6 border border-white/40">
                    <Wrapper 
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
                        render={render}
                        libraries={['marker']}
                    >
                        <MapComponent 
                            center={center} 
                            zoom={14} 
                            markers={nodosCongata}
                        />
                    </Wrapper>
                </div>
                
                {/* Panel de información */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {nodosCongata.map((nodo) => (
                        <div key={nodo.id} className="bg-white/70 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border border-white/50 hover:shadow-xl hover:bg-white/80 transition-all duration-300">
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                                <h3 className="font-semibold text-blue-900 text-base sm:text-lg">{nodo.nom}</h3>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1 sm:mr-2 animate-pulse shadow-lg"></div>
                                    <span className="text-xs text-green-800 font-medium bg-green-100/50 px-1 sm:px-2 py-1 rounded-full">ACTIVO</span>
                                </div>
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm text-gray-700">
                                    <span className="font-medium">ID:</span> 
                                    <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-1 bg-blue-100/70 text-blue-800 rounded text-xs font-mono">
                                        {nodo.id}
                                    </span>
                                </p>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    <span className="font-medium">Latitud:</span> 
                                    <span className="ml-1 sm:ml-2 font-mono text-xs sm:text-sm">{nodo.lat}</span>
                                </p>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    <span className="font-medium">Longitud:</span> 
                                    <span className="ml-1 sm:ml-2 font-mono text-xs sm:text-sm">{nodo.lng}</span>
                                </p>
                            </div>
                            <div className="mt-2 sm:mt-3 p-2 bg-gradient-to-r from-green-100/70 to-blue-100/70 rounded-lg border border-green-200/50 backdrop-blur-sm">
                                <p className="text-xs text-green-800 font-medium">
                                    📡 Monitoreo en tiempo real
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Información adicional */}
                <div className="mt-4 sm:mt-6 bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-white/50">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                        Información del Sistema de Monitoreo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-700">
                        <div className="space-y-1">
                            <p><strong>Región:</strong> Congata, Arequipa</p>
                            <p><strong>Sensores activos:</strong> {nodosCongata.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p><strong>Última actualización:</strong> Tiempo real</p>
                            <p><strong>Tipo de monitoreo:</strong> Calidad del aire</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}