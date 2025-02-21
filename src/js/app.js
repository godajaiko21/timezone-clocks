// Process time input
function processTimeInput(input) {
    // Remove any whitespace
    input = input.trim();

    // If empty, return current time
    if (!input) {
        return luxon.DateTime.local().toFormat("yyyy-MM-dd'T'HH:mm");
    }

    // Check if the input contains timezone information and remove it
    const hasTimezone = input.match(/[+-]\d{2}:\d{2}$/) || input.endsWith('Z');
    if (hasTimezone) {
        // Remove timezone part before any parsing
        input = input.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    }

    // Parse the input (now without timezone)
    let parsed = luxon.DateTime.fromFormat(input, "yyyy-MM-dd'T'HH:mm:ss");
    if (!parsed.isValid) {
        parsed = luxon.DateTime.fromFormat(input, "yyyy-MM-dd'T'HH:mm");
    }

    // If parsing failed, return null
    if (!parsed.isValid) {
        return null;
    }

    // Format the time without seconds
    return parsed.toFormat("yyyy-MM-dd'T'HH:mm");
}

// Main Application Logic
const App = {
    // Show toast notification
    showToast: (message, duration = 2000) => {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    showError: (message) => {
        document.getElementById('clockImage').innerHTML = `
            <div style="
                padding: 20px;
                color: #721c24;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                text-align: left;
            ">
                <h3 style="margin-bottom: 10px;">Error</h3>
                <p>${message}</p>
            </div>
        `;
    },

    // Update time zones and clocks
    updateTimeZones: () => {
        try {
            const { DateTime } = luxon;
            const DEFAULT_SOURCE_TZ = 'Asia/Tokyo';

            // Get form values
            const sourceTz = document.getElementById('sourceTz').value || DEFAULT_SOURCE_TZ;
            const targetTzs = Array.from(document.querySelectorAll('.targetTz'))
                .map(select => select.value)
                .filter(value => value !== '')

            const timeInput = document.getElementById('time');
            const time = timeInput.value;

            // Validate time format
            if (!time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                App.showError('Invalid time format. Please use YYYY-MM-DDThh:mm format.');
                return;
            }

            // Additional validation for date and time values
            const [datePart, timePart] = time.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);

            // Validate date and time values
            if (
                year < 1000 || year > 9999 ||
                month < 1 || month > 12 ||
                day < 1 || day > 31 ||
                hours < 0 || hours > 23 ||
                minutes < 0 || minutes > 59
            ) {
                App.showError('Invalid date or time values. Please ensure all values are within valid ranges.');
                return;
            }

            // Additional validation for valid date
            const parsed = DateTime.fromFormat(time, "yyyy-MM-dd'T'HH:mm");
            if (!parsed.isValid) {
                App.showError('Invalid date. The specified date does not exist.');
                return;
            }

            // Calculate times for all zones
            const timeZoneInfos = [sourceTz, ...targetTzs].map(tz => {
                if (!tz) return null;

                if (tz === sourceTz) {
                    const sourceDateTime = DateTime.fromObject(
                        {
                            year, month, day, hour: hours, minute: minutes
                        },
                        { zone: sourceTz }
                    );

                    return {
                        zoneName: TimezoneUtils.getReadableName(tz),
                        hour: hours,
                        minute: minutes,
                        formattedTime: sourceDateTime.toFormat('yyyy MMM d, ccc, h:mm a'),
                        isNightTime: ClockUtils.isNightTime(hours)
                    };
                } else {
                    const sourceDateTime = DateTime.fromObject(
                        {
                            year, month, day, hour: hours, minute: minutes
                        },
                        { zone: sourceTz }
                    );
                    const targetDateTime = sourceDateTime.setZone(tz);

                    return {
                        zoneName: TimezoneUtils.getReadableName(tz),
                        hour: targetDateTime.hour,
                        minute: targetDateTime.minute,
                        formattedTime: targetDateTime.toFormat('yyyy MMM d, ccc, h:mm a'),
                        isNightTime: ClockUtils.isNightTime(targetDateTime.hour)
                    };
                }
            }).filter(info => info !== null);

            // Generate full URL with parameters
            const fullUrl = new URL(window.location.href);
            fullUrl.searchParams.set('time', time);
            fullUrl.searchParams.set('sourceTz', sourceTz);
            if (targetTzs.length > 0) {
                fullUrl.searchParams.set('targetTz', targetTzs.join(','));
            } else {
                fullUrl.searchParams.delete('targetTz');
            }

            // Generate multi-clock SVG
            const multiClockSvg = ClockUtils.createMultiClockSvg(timeZoneInfos);

            // Check for NaN in SVG
            if (multiClockSvg.includes('NaN')) {
                throw new Error('Invalid clock generation: NaN values detected');
            }

            // Update browser history and URL
            window.history.replaceState({}, '', fullUrl);

            // Update displays
            document.getElementById('clockImage').innerHTML = multiClockSvg;
            document.getElementById('ogPreviewImage').innerHTML = multiClockSvg;
            document.getElementById('previewUrl').textContent = window.location.href;
            document.getElementById('ogImageUrl').content = `data:image/svg+xml;base64,${btoa(multiClockSvg)}`;
            document.getElementById('shareUrl').value = window.location.href;

        } catch (error) {
            console.error('Error updating time zones:', error);
            App.showError('An error occurred while generating the clock display. Please try again.');
        }
    },

    // Copy URL to clipboard
    copyUrl: () => {
        const shareUrl = document.getElementById('shareUrl');
        shareUrl.select();
        document.execCommand('copy');
        App.showToast('URL copied to clipboard');
    },

    // Copy SVG image to clipboard or download
    copyImage: async () => {
        try {
            const svg = document.querySelector('#clockImage svg');
            if (!svg) {
                throw new Error('No SVG found');
            }

            // Check clipboard support
            const hasClipboardSupport =
                navigator.clipboard &&
                typeof navigator.clipboard.write === 'function';

            // Check if it's a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // For desktop with clipboard support
            if (!isMobile && hasClipboardSupport) {
                // Convert SVG to data URL
                const svgData = new XMLSerializer().serializeToString(svg);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const DOMURL = window.URL || window.webkitURL || window;
                const url = DOMURL.createObjectURL(svgBlob);

                // Create canvas and draw SVG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                // Convert SVG to PNG using canvas
                await new Promise((resolve, reject) => {
                    img.onload = async () => {
                        try {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);

                            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    'image/png': blob
                                })
                            ]);

                            App.showToast('Image copied to clipboard');
                            resolve();
                        } catch (error) {
                            reject(error);
                        } finally {
                            DOMURL.revokeObjectURL(url);
                        }
                    };
                    img.onerror = () => reject(new Error('Failed to load SVG'));
                    img.src = url;
                });
                return;
            }

            // Try Web Share API for mobile devices
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const file = new File([svgBlob], 'timezone-clocks.svg', { type: 'image/svg+xml' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Timezone Clocks',
                    text: 'Check out these timezone clocks!'
                });
                App.showToast('Image shared successfully');
                return;
            }

            // Fallback to download
            const url = URL.createObjectURL(svgBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'timezone-clocks.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            App.showToast('Image downloaded');

        } catch (error) {
            console.error('Image operation failed:', error);
            App.showToast('Failed to process image');
        }
    },

    // Toggle dark mode
    toggleDarkMode: () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    },

    // Initialize the application
    init: () => {
        try {
            const { DateTime } = luxon;
            const DEFAULT_SOURCE_TZ = 'Asia/Tokyo';

            // Check for saved dark mode preference
            if (localStorage.getItem('darkMode') === 'true') {
                document.body.classList.add('dark-mode');
            }

            // Set up form elements
            const timeInput = document.getElementById('time');
            const sourceSelect = document.getElementById('sourceTz');
            const copyImageBtn = document.getElementById('copyImageBtn');

            // Update button text based on device type
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                copyImageBtn.textContent = 'Download Image';
            }

            // Handle URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const time = urlParams.get('time');
            const sourceTz = urlParams.get('sourceTz');

            let processedTime, processedSourceTz;

            // Get system timezone or use default
            const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_SOURCE_TZ;

            // Process date and time parameter
            if (!time) {
                // Case 1: No time parameter - use current local time
                const now = DateTime.local();
                processedTime = now.toFormat("yyyy-MM-dd'T'HH:mm");
                processedSourceTz = systemTimezone;
            } else {
                // Decode time parameter
                const decodedTime = decodeURIComponent(time);

                try {
                    // Check if time includes timezone info
                    if (decodedTime.match(/[+-]\d{2}:\d{2}$/) || decodedTime.endsWith('Z')) {
                        // Case 3: Time with timezone info
                        const parsed = DateTime.fromISO(decodedTime);
                        if (!parsed.isValid) throw new Error('Invalid time format');

                        processedTime = parsed.toFormat("yyyy-MM-dd'T'HH:mm");
                        processedSourceTz = parsed.zoneName;
                    } else {
                        // Case 2: Time without timezone info
                        const parsed = DateTime.fromFormat(decodedTime, "yyyy-MM-dd'T'HH:mm");
                        if (!parsed.isValid) throw new Error('Invalid time format');

                        processedTime = decodedTime;
                        processedSourceTz = systemTimezone;
                    }
                } catch (error) {
                    console.warn('Error processing time parameter:', error);
                    const now = DateTime.local();
                    processedTime = now.toFormat("yyyy-MM-dd'T'HH:mm");
                    processedSourceTz = systemTimezone;
                }
            }

            // Override source timezone if provided in URL
            if (sourceTz) {
                processedSourceTz = decodeURIComponent(sourceTz);
            }

            // Update input field and selected timezone
            timeInput.value = processedTime;
            sourceSelect.value = processedSourceTz;
            sourceSelect.dataset.prevValue = processedSourceTz;

            // Process target timezones
            const targetTz = urlParams.get('targetTz');
            if (targetTz) {
                try {
                    const targetTzList = decodeURIComponent(targetTz).split(',');
                    const targetSelects = document.querySelectorAll('.targetTz');
                    targetTzList.forEach((tz, index) => {
                        if (targetSelects[index]) {
                            targetSelects[index].value = tz;
                        }
                    });
                } catch (error) {
                    console.warn('Error processing targetTz parameter:', error);
                }
            }

            // Initial update of clocks
            App.updateTimeZones();

            // Attach event listeners
            timeInput.addEventListener('change', (e) => {
                const processedTime = processTimeInput(e.target.value);
                if (processedTime === null) {
                    App.showError('Invalid time format. Please use YYYY-MM-DDThh:mm format.');
                    return;
                }
                e.target.value = processedTime;
                App.updateTimeZones();
            });

            // Add real-time validation feedback
            timeInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (!value) {
                    e.target.setCustomValidity('');
                    e.target.classList.remove('error');
                    return;
                }

                // Try to process the input
                const processedTime = processTimeInput(value);
                if (processedTime === null) {
                    e.target.setCustomValidity('Please use the format: YYYY-MM-DDThh:mm');
                    e.target.classList.add('error');
                } else {
                    e.target.setCustomValidity('');
                    e.target.classList.remove('error');
                }
            });

            // Add blur handler for empty input
            timeInput.addEventListener('blur', (e) => {
                if (!e.target.value.trim()) {
                    const currentTime = processTimeInput('');  // Will return current time
                    e.target.value = currentTime;
                    App.updateTimeZones();
                }
            });

            sourceSelect.addEventListener('change', App.updateTimeZones);
            document.querySelectorAll('.targetTz').forEach(select => {
                select.addEventListener('change', App.updateTimeZones);
            });

            // Attach copy button listeners
            document.getElementById('copyUrlBtn').addEventListener('click', App.copyUrl);
            document.getElementById('copyImageBtn').addEventListener('click', App.copyImage);
        } catch (error) {
            console.error('Error initializing application:', error);
            App.showError('An error occurred while initializing the application. Please try reloading the page.');
        }
    }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', App.init);
