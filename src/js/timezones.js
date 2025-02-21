// Comprehensive list of global time zones grouped by regions
const TIMEZONE_GROUPS = {
    'Asia': [
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Asia/Seoul',
        'Asia/Taipei',
        'Asia/Manila',
        'Asia/Bangkok',
        'Asia/Jakarta',
        'Asia/Kuala_Lumpur',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Jerusalem'
    ],
    'Americas': [
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'America/Denver',
        'America/Toronto',
        'America/Vancouver',
        'America/Phoenix',
        'America/Anchorage',
        'America/Halifax',
        'America/Mexico_City',
        'America/Sao_Paulo',
        'America/Buenos_Aires',
        'America/Lima',
        'America/Bogota'
    ],
    'Europe': [
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Moscow',
        'Europe/Madrid',
        'Europe/Rome',
        'Europe/Amsterdam',
        'Europe/Istanbul',
        'Europe/Dublin',
        'Europe/Copenhagen',
        'Europe/Warsaw'
    ],
    'Oceania': [
        'Australia/Sydney',
        'Australia/Perth',
        'Pacific/Auckland',
        'Pacific/Honolulu',
        'Pacific/Guam'
    ],
    'Africa': [
        'Africa/Cairo',
        'Africa/Johannesburg',
        'Africa/Lagos',
        'Africa/Nairobi'
    ]
};

// Utility functions for handling timezones
const TimezoneUtils = {
    // Convert timezone name to a readable format
    getReadableName: (timezone) => {
        const parts = timezone.split('/');
        return parts[1] ? parts[1].replace('_', ' ') : timezone;
    },

    // Create sorted list of all available timezones
    getAllTimezones: () => {
        return Object.values(TIMEZONE_GROUPS).flat();
    },

    // Populate timezone selection dropdowns
    populateTimezoneSelects: () => {
        const sourceSelect = document.getElementById('sourceTz');
        const targetSelects = document.querySelectorAll('.targetTz');

        // Clear existing options
        sourceSelect.innerHTML = '';
        targetSelects.forEach(select => select.innerHTML = '');

        // Function to populate a select element
        const populateSelect = (select, addEmptyOption = false) => {
            if (addEmptyOption) {
                select.add(new Option('(None)', ''));
            }

            // Add timezone groups
            for (const [groupName, timezones] of Object.entries(TIMEZONE_GROUPS)) {
                const group = document.createElement('optgroup');
                group.label = groupName;

                // Sort timezones within the group
                timezones.sort((a, b) => {
                    return TimezoneUtils.getReadableName(a).localeCompare(
                        TimezoneUtils.getReadableName(b)
                    );
                });

                // Add options to group
                timezones.forEach(tz => {
                    const cityName = TimezoneUtils.getReadableName(tz);
                    const optionText = `${cityName} (${tz})`;
                    group.appendChild(new Option(optionText, tz));
                });

                select.appendChild(group);
            }
        };

        // Populate source select
        populateSelect(sourceSelect);

        // Populate target selects
        targetSelects.forEach((select, index) => {
            // Only set default value for first select, others remain empty
            populateSelect(select, index > 0);
        });

        // Set default values
        sourceSelect.value = 'Asia/Tokyo';
        targetSelects[0].value = 'America/New_York';
        targetSelects[1].value = '';
        targetSelects[2].value = '';
        targetSelects[3].value = '';
    },

    // Convert source time to local time in target timezone
    convertToLocalTime: (sourceTime, targetTimezone) => {
        const { DateTime } = luxon;
        return sourceTime.setZone(targetTimezone);
    }
};

// Initialize timezones on page load
document.addEventListener('DOMContentLoaded', () => {
    TimezoneUtils.populateTimezoneSelects();
});