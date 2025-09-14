import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PencilIcon,
    TrashIcon,
    DocumentDuplicateIcon,
    MapPinIcon,
    ClockIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { TourService } from '../../services/tourService';
import { Tour, TourFilters } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant, getTourTypeBadgeVariant, formatTourType } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import TourForm from './TourForm';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getMeetingPointLocation } from '../../utils/tourUtils';

const TourList: React.FC = () => {
    const { hasPermission } = useAdminAuth();
    const queryClient = useQueryClient();

    // State for modals and forms
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filters and search
    const [filters, setFilters] = useState<TourFilters>({});
    const [searchQuery, setSearchQuery] = useState('');

    // Selection for bulk operations
    const [selectedTours, setSelectedTours] = useState<string[]>([]);

    // Build query filters
    const queryFilters = useMemo(() => ({
        ...filters,
        searchQuery: searchQuery.trim() || undefined
    }), [filters, searchQuery]);

    // Queries
    const {
        data: tours = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['tours', queryFilters],
        queryFn: () => TourService.getTours(queryFilters),
        refetchInterval: 30000,
    });

    // Debug: Log tour data when it changes
    React.useEffect(() => {
        if (tours && tours.length > 0) {
            console.log('Tours loaded from database:', tours);
            console.log('First tour duration_minutes:', tours[0].duration_minutes, 'Type:', typeof tours[0].duration_minutes);
        }
    }, [tours]);

    const {
        data: tourStats,
        isLoading: statsLoading
    } = useQuery({
        queryKey: ['tour-stats'],
        queryFn: () => TourService.getTourStats(),
        refetchInterval: 60000,
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: string) => TourService.deleteTour(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            queryClient.invalidateQueries({ queryKey: ['tour-stats'] });
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: ({ tourId, newName }: { tourId: string; newName: string }) =>
            TourService.duplicateTour(tourId, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'inactive' | 'draft' }) =>
            TourService.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            setSelectedTours([]);
        },
    });

    // Event handlers
    const handleEdit = (tour: Tour) => {
        console.log('✏️ Edit button clicked for tour:', tour);
        console.log('🕐 Tour duration_minutes:', tour.duration_minutes);
        setSelectedTour(tour);
        setShowEditModal(true);
    };

    const handleDelete = (tour: Tour) => {
        if (window.confirm(`Are you sure you want to delete "${tour.name}"? This action cannot be undone.`)) {
            deleteMutation.mutate(tour.id);
        }
    };

    const handleDuplicate = (tour: Tour) => {
        const newName = prompt('Enter name for the duplicated tour:', `${tour.name} (Copy)`);
        if (newName && newName.trim()) {
            duplicateMutation.mutate({ tourId: tour.id, newName: newName.trim() });
        }
    };

    const handleFormSuccess = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedTour(null);
        queryClient.invalidateQueries({ queryKey: ['tours'] });
        queryClient.invalidateQueries({ queryKey: ['tour-stats'] });
    };

    const handleFilterChange = (key: keyof TourFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    const handleTourSelection = (tourId: string, checked: boolean) => {
        if (checked) {
            setSelectedTours(prev => [...prev, tourId]);
        } else {
            setSelectedTours(prev => prev.filter(id => id !== tourId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTours(tours.map(tour => tour.id));
        } else {
            setSelectedTours([]);
        }
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error loading tours: {error.message}</div>
                <Button onClick={() => refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tour Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your tour products and availability
                    </p>
                </div>
                {hasPermission('manage_tours') && (
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Tour
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            {!statsLoading && tourStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <MapPinIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Tours</p>
                                <p className="text-2xl font-bold text-gray-900">{tourStats.totalTours}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Tours</p>
                                <p className="text-2xl font-bold text-gray-900">{tourStats.activeTours}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <UsersIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                <p className="text-2xl font-bold text-gray-900">{tourStats.totalBookings}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tours..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="ghost"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center"
                    >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filters
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.status?.[0] || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tour Type
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.tourType?.[0] || ''}
                                    onChange={(e) => handleFilterChange('tourType', e.target.value ? [e.target.value] : undefined)}
                                >
                                    <option value="">All Tour Types</option>
                                    <option value="NIGHT_TOUR">Night Tour</option>
                                    <option value="MORNING_TOUR">Morning Tour</option>
                                    <option value="UJI_TOUR">Uji Tour</option>
                                    <option value="UJI_WALKING_TOUR">Uji Walking Tour</option>
                                    <option value="GION_TOUR">Gion Tour</option>
                                    <option value="MUSIC_TOUR">Music Tour</option>
                                    <option value="UJI_TOUR">Uji Tour</option>
                                    <option value="GION_TOUR">Gion Tour</option>
                                </select>
                            </div>


                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button variant="ghost" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                            <Button variant="ghost" onClick={() => setShowFilters(false)}>
                                Hide Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedTours.length > 0 && hasPermission('manage_tours') && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-900">
                            {selectedTours.length} tours selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => bulkStatusMutation.mutate({ ids: selectedTours, status: 'active' })}
                                loading={bulkStatusMutation.isPending}
                            >
                                Activate
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => bulkStatusMutation.mutate({ ids: selectedTours, status: 'inactive' })}
                                loading={bulkStatusMutation.isPending}
                            >
                                Deactivate
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTours([])}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tours Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading tours...</p>
                    </div>
                ) : tours.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tours found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filters.searchQuery || filters.status || filters.tourType
                                ? 'No tours match your current filters.'
                                : 'Get started by setting up your database and creating your first tour.'
                            }
                        </p>
                        {(!filters.searchQuery && !filters.status && !filters.tourType) && (
                            <div className="mt-6 max-w-md mx-auto">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                                        🚀 First Time Setup Required
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Run the database setup script in your Supabase dashboard to create the tours table and sample data.
                                    </p>
                                    <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                                        <li>Go to your Supabase dashboard</li>
                                        <li>Navigate to SQL Editor</li>
                                        <li>Copy and run the script from: <code className="bg-blue-100 px-1 rounded">simple-tour-setup.sql</code></li>
                                        <li>Refresh this page</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                        {hasPermission('manage_tours') && (
                            <div className="mt-6">
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Create Tour
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {hasPermission('manage_tours') && (
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={selectedTours.length === tours.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tour
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type & Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration & Difficulty
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Capacity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tours.map((tour) => (
                                    <tr key={tour.id} className="hover:bg-gray-50">
                                        {hasPermission('manage_tours') && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    checked={selectedTours.includes(tour.id)}
                                                    onChange={(e) => handleTourSelection(tour.id, e.target.checked)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {tour.name}
                                                        </div>

                                                    </div>
                                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                                        {tour.description}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        <MapPinIcon className="h-3 w-3 inline mr-1" />
                                                        {getMeetingPointLocation(tour.meeting_point)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <Badge variant={getTourTypeBadgeVariant(tour?.type)}>
                                                    {formatTourType(tour?.type)}
                                                </Badge>
                                                {tour?.status && (
                                                    <Badge variant={getStatusBadgeVariant(tour.status)}>
                                                        {tour.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900">
                                                    {tour?.duration_minutes ? (tour.duration_minutes / 60) : 'N/A'} hours
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {tour?.min_participants || 0} - {tour?.max_participants || 0} people
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {hasPermission('manage_tours') && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(tour)}
                                                            className="flex items-center"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDuplicate(tour)}
                                                            className="flex items-center"
                                                            loading={duplicateMutation.isPending}
                                                        >
                                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(tour)}
                                                            className="flex items-center text-red-600 hover:text-red-700"
                                                            loading={deleteMutation.isPending}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New Tour"
                    size="xl"
                >
                    <TourForm
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </Modal>
            )}

            {showEditModal && selectedTour && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Edit Tour"
                    size="xl"
                >
                    <TourForm
                        tour={selectedTour}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowEditModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default TourList; 