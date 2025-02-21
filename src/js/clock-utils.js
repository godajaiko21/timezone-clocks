// Clock visualization utility functions
const ClockUtils = {
    // Create a single analog clock SVG
    createAnalogClock: (hour, minute, isNightTime) => {
        try {
            const hourAngle = (hour % 12 + minute / 60) * 30;
            const minuteAngle = minute * 6;

            // Check for NaN values
            if (isNaN(hourAngle) || isNaN(minuteAngle)) {
                throw new Error('Invalid angle calculation');
            }

            // Color scheme based on day/night
            const backgroundColor = isNightTime ? '#1a2b3c' : '#e6f2ff';
            const clockColor = isNightTime ? '#c0c0c0' : '#333';

            // Generate clock hour markers
            const hourMarkers = Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const numberRadius = 70;
                const x = 100 + numberRadius * Math.cos(angle);
                const y = 100 + numberRadius * Math.sin(angle);
                return `<text 
                    x="${x}" 
                    y="${y + 2}" 
                    text-anchor="middle" 
                    dominant-baseline="middle" 
                    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    font-size="24" 
                    font-weight="bold" 
                    fill="${clockColor}"
                >${i === 0 ? '12' : i}</text>`;
            }).join('');

            // Create SVG for analog clock
            return `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                    <circle cx="100" cy="100" r="90" fill="${backgroundColor}" stroke="${clockColor}" stroke-width="3"/>
                    ${hourMarkers}
                    <line 
                        x1="100"
                        y1="100"
                        x2="${100 + 50 * Math.sin(hourAngle * Math.PI / 180)}"
                        y2="${100 - 50 * Math.cos(hourAngle * Math.PI / 180)}"
                        stroke="${clockColor}"
                        stroke-width="5"
                        stroke-linecap="round"
                    />
                    <line 
                        x1="100"
                        y1="100"
                        x2="${100 + 70 * Math.sin(minuteAngle * Math.PI / 180)}"
                        y2="${100 - 70 * Math.cos(minuteAngle * Math.PI / 180)}"
                        stroke="${clockColor}"
                        stroke-width="3"
                        stroke-linecap="round"
                    />
                    <circle cx="100" cy="100" r="4" fill="${clockColor}"/>
                </svg>
            `;
        } catch (error) {
            console.error('Error creating analog clock:', error);
            return `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
                    <circle cx="100" cy="100" r="90" fill="#f8d7da" stroke="#721c24" stroke-width="3"/>
                    <text 
                        x="100" 
                        y="100" 
                        text-anchor="middle" 
                        dominant-baseline="middle"
                        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                        fill="#721c24"
                    >Error</text>
                </svg>
            `;
        }
    },

    // Create multiple clocks for different timezones
    createMultiClockSvg: (timeZoneInfos) => {
        const CLOCK_SIZE = 200;
        const HORIZONTAL_PADDING = 50;
        const VERTICAL_PADDING = 40;
        const LABEL_HEIGHT = 75;
        const TEXT_SPACING = 30;

        const validTimeZoneInfos = timeZoneInfos.filter(info => info && info.zoneName);
        
        const totalWidth = validTimeZoneInfos.length * (CLOCK_SIZE + HORIZONTAL_PADDING) + HORIZONTAL_PADDING;
        const totalHeight = CLOCK_SIZE + VERTICAL_PADDING * 2 + LABEL_HEIGHT;

        const clocksAndLabels = validTimeZoneInfos.map((info, i) => {
            const x = HORIZONTAL_PADDING + i * (CLOCK_SIZE + HORIZONTAL_PADDING);
            const y = VERTICAL_PADDING;
            return `
                <g transform="translate(${x}, ${y})">
                    ${ClockUtils.createAnalogClock(info.hour, info.minute, info.isNightTime)}
                    <text 
                        x="${CLOCK_SIZE/2}"
                        y="${CLOCK_SIZE + 25}"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                        font-size="20"
                        font-weight="bold"
                        fill="#333"
                    >${info.zoneName}</text>
                    <text 
                        x="${CLOCK_SIZE/2}"
                        y="${CLOCK_SIZE + 25 + TEXT_SPACING}"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                        font-size="18"
                        fill="#333"
                    >${info.formattedTime}</text>
                </g>
            `;
        }).join('');

        return `
            <svg xmlns="http://www.w3.org/2000/svg" 
                 viewBox="0 0 ${totalWidth} ${totalHeight}"
                 width="${totalWidth}" 
                 height="${totalHeight}"
                 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <defs>
                    <style>
                        @font-face {
                            font-family: 'system-ui';
                            font-style: normal;
                            font-weight: 400;
                            src: local(".SFNS-Regular"), local(".SFNSText-Regular"), local(".HelveticaNeueDeskInterface-Regular"), local(".LucidaGrandeUI"), local("Segoe UI"), local("Ubuntu"), local("Roboto-Regular"), local("DroidSans"), local("Tahoma");
                        }
                    </style>
                </defs>
                <rect width="${totalWidth}" height="${totalHeight}" fill="white"/>
                ${clocksAndLabels}
            </svg>
        `;
    },

    // Determine if it's night time
    isNightTime: (hour) => {
        return hour >= 18 || hour < 6;
    }
};