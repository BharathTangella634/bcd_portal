import React from 'react';
import './RiskTable.css';

const RiskTable = () => {
    const tableData = [
        {
            category: 'Baseline',
            percentage: '≤ 14%',
            description: (
                <span><strong>The "Baseline" Category:</strong> Most women fall in this group, with no major known risk indicators.</span>
            ),
            nextSteps: ['Routine screening']
        },
        {
            category: 'Evident',
            percentage: '15% - 19%',
            description: (
                <span><strong>The "Watchful" Category:</strong> You have a few mild risk indicators that may be worth monitoring over time.</span>
            ),
            nextSteps: [
                'Continue routine screening.',
                'Yearly mammography based screening is mandatory.'
            ]
        },
        {
            category: 'Significant',
            percentage: '20% - 24%',
            description: (
                <span><strong>The "Increased" Category:</strong> You have at least one strong risk indicator that places you at a moderately elevated risk.</span>
            ),
            nextSteps: [
                'Routine screening with yearly mammography being mandatory.',
                'Supplemental screening is needed as well.'
            ]
        },
        {
            category: 'High',
            percentage: '≥ 25%',
            description: (
                <span><strong>The "Intensive" Category:</strong> You are at the highest risk and need closer clinical attention.</span>
            ),
            nextSteps: [
                'Routine screening with yearly mammography being mandatory.',
                'Additional annual screening including breast MRI is desirable.',
                'Genetic counseling and relatives screening might be necessary.'
            ]
        }
    ];

    return (
        <div id="risk-categories-table" className="risk-table-container fade-in">
            <h4 className="risk-table-title">Risk Categories Reference</h4>
            <div className="risk-table-wrapper">
                <table className="risk-table">
                    <thead>
                        <tr>
                            <th>Risk Category</th>
                            <th>Lifetime Risk Percentage</th>
                            <th>Description</th>
                            <th>Recommendation (next steps)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, idx) => {
                            let bgColor = 'inherit';
                            if (row.category.includes('High')) bgColor = '#fb7185';
                            else if (row.category.includes('Significant')) bgColor = '#fb923c';
                            else if (row.category.includes('Evident')) bgColor = '#fde047';
                            else if (row.category.includes('Baseline')) bgColor = '#6ee7b7';

                            return (
                                <tr key={idx} style={{ backgroundColor: bgColor, color: '#111' }}>
                                    <td style={{ color: '#111', fontWeight: '500' }}>{row.category}</td>
                                    <td style={{ color: '#111', whiteSpace: 'nowrap' }}>{row.percentage}</td>
                                    <td style={{ color: '#111' }}>{row.description}</td>
                                    <td style={{ color: '#111' }}>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                            {row.nextSteps.map((step, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="risk-table-footnote">
                <span style={{ color: '#e03944', fontWeight: 700 }}>*</span>{' '}
                Risk categories shown in the Risk Prediction chart are based on the lifetime risk thresholds defined in this table.
            </p>
        </div>
    );
};

export default RiskTable;
