#!/usr/bin/env node

/**
 * Security Audit Script for DeFi Cross-Chain Yield Aggregator
 * 
 * This script runs comprehensive security analysis using:
 * - Slither for static analysis
 * - Custom vulnerability checks
 * - Gas optimization analysis
 * - Access control verification
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityAuditor {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            contracts: [],
            vulnerabilities: [],
            recommendations: [],
            summary: {
                totalContracts: 0,
                highRisk: 0,
                mediumRisk: 0,
                lowRisk: 0,
                info: 0
            }
        };
    }

    async runSlitherAnalysis() {
        console.log('🔍 Running Slither static analysis...');
        
        try {
            // Run Slither on all contracts
            const slitherOutput = execSync('slither contracts/ --json', { 
                encoding: 'utf8',
                cwd: process.cwd()
            });
            
            const slitherResults = JSON.parse(slitherOutput);
            this.processSlitherResults(slitherResults);
            
        } catch (error) {
            console.log('⚠️  Slither analysis completed with findings');
            // Slither returns non-zero exit code when vulnerabilities are found
            if (error.stdout) {
                try {
                    const slitherResults = JSON.parse(error.stdout);
                    this.processSlitherResults(slitherResults);
                } catch (parseError) {
                    console.log('Could not parse Slither output as JSON');
                }
            }
        }
    }

    processSlitherResults(results) {
        if (results.results && results.results.detectors) {
            results.results.detectors.forEach(detector => {
                const vulnerability = {
                    type: 'slither',
                    detector: detector.check,
                    severity: this.mapSeverity(detector.impact),
                    confidence: detector.confidence,
                    description: detector.description,
                    elements: detector.elements || [],
                    contracts: detector.contracts || []
                };
                
                this.report.vulnerabilities.push(vulnerability);
                this.updateSummary(vulnerability.severity);
            });
        }
    }

    mapSeverity(impact) {
        const severityMap = {
            'High': 'high',
            'Medium': 'medium', 
            'Low': 'low',
            'Informational': 'info'
        };
        return severityMap[impact] || 'info';
    }

    updateSummary(severity) {
        switch (severity) {
            case 'high':
                this.report.summary.highRisk++;
                break;
            case 'medium':
                this.report.summary.mediumRisk++;
                break;
            case 'low':
                this.report.summary.lowRisk++;
                break;
            case 'info':
                this.report.summary.info++;
                break;
        }
    }

    async runCustomVulnerabilityChecks() {
        console.log('🔍 Running custom vulnerability checks...');
        
        const contracts = this.getContractFiles();
        this.report.summary.totalContracts = contracts.length;
        
        for (const contract of contracts) {
            await this.analyzeContract(contract);
        }
    }

    getContractFiles() {
        const contractsDir = path.join(process.cwd(), 'contracts');
        const files = [];
        
        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (item.endsWith('.sol')) {
                    files.push(fullPath);
                }
            });
        };
        
        scanDir(contractsDir);
        return files;
    }

    async analyzeContract(contractPath) {
        const content = fs.readFileSync(contractPath, 'utf8');
        const contractName = path.basename(contractPath, '.sol');
        
        const contract = {
            name: contractName,
            path: contractPath,
            vulnerabilities: []
        };

        // Check for common vulnerabilities
        this.checkReentrancy(content, contract);
        this.checkAccessControl(content, contract);
        this.checkIntegerOverflow(content, contract);
        this.checkUncheckedCalls(content, contract);
        this.checkTimestampDependency(content, contract);
        this.checkGasOptimization(content, contract);
        this.checkEventLogging(content, contract);

        this.report.contracts.push(contract);
    }

    checkReentrancy(content, contract) {
        const reentrancyPatterns = [
            /\.call\s*\(/g,
            /\.send\s*\(/g,
            /\.transfer\s*\(/g
        ];

        reentrancyPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                contract.vulnerabilities.push({
                    type: 'reentrancy',
                    severity: 'high',
                    description: 'Potential reentrancy vulnerability detected',
                    recommendation: 'Use checks-effects-interactions pattern or OpenZeppelin ReentrancyGuard'
                });
            }
        });
    }

    checkAccessControl(content, contract) {
        const hasAccessControl = content.includes('onlyOwner') || 
                                content.includes('AccessControl') ||
                                content.includes('Ownable');
        
        const hasAdminFunctions = content.includes('function') && 
                                 (content.includes('set') || content.includes('update') || content.includes('add'));
        
        if (hasAdminFunctions && !hasAccessControl) {
            contract.vulnerabilities.push({
                type: 'access-control',
                severity: 'high',
                description: 'Admin functions without proper access control',
                recommendation: 'Implement onlyOwner modifier or AccessControl from OpenZeppelin'
            });
        }
    }

    checkIntegerOverflow(content, contract) {
        const hasUncheckedMath = content.includes('+') || content.includes('-') || content.includes('*');
        const hasSafeMath = content.includes('SafeMath') || content.includes('unchecked');
        
        if (hasUncheckedMath && !hasSafeMath) {
            contract.vulnerabilities.push({
                type: 'integer-overflow',
                severity: 'medium',
                description: 'Potential integer overflow/underflow',
                recommendation: 'Use SafeMath or Solidity 0.8+ built-in overflow protection'
            });
        }
    }

    checkUncheckedCalls(content, contract) {
        const uncheckedCalls = content.match(/\.call\s*\([^)]*\)(?!\s*\{)/g);
        if (uncheckedCalls) {
            contract.vulnerabilities.push({
                type: 'unchecked-calls',
                severity: 'medium',
                description: 'Unchecked external calls',
                recommendation: 'Check return values of external calls'
            });
        }
    }

    checkTimestampDependency(content, contract) {
        const hasTimestamp = content.includes('block.timestamp') || content.includes('now');
        if (hasTimestamp) {
            contract.vulnerabilities.push({
                type: 'timestamp-dependency',
                severity: 'low',
                description: 'Timestamp dependency detected',
                recommendation: 'Be aware of miner manipulation of block.timestamp'
            });
        }
    }

    checkGasOptimization(content, contract) {
        const gasOptimizations = [];
        
        // Check for expensive operations in loops
        if (content.includes('for') && content.includes('storage')) {
            gasOptimizations.push('Consider caching storage variables in loops');
        }
        
        // Check for unnecessary storage operations
        if (content.includes('memory') && content.includes('storage')) {
            gasOptimizations.push('Use memory instead of storage when possible');
        }
        
        if (gasOptimizations.length > 0) {
            contract.vulnerabilities.push({
                type: 'gas-optimization',
                severity: 'info',
                description: 'Gas optimization opportunities',
                recommendation: gasOptimizations.join('; ')
            });
        }
    }

    checkEventLogging(content, contract) {
        const hasEvents = content.includes('event ');
        const hasImportantFunctions = content.includes('function') && 
                                     (content.includes('deposit') || content.includes('withdraw') || 
                                      content.includes('transfer') || content.includes('mint'));
        
        if (hasImportantFunctions && !hasEvents) {
            contract.vulnerabilities.push({
                type: 'event-logging',
                severity: 'low',
                description: 'Important functions without event logging',
                recommendation: 'Add events for important state changes'
            });
        }
    }

    generateRecommendations() {
        const recommendations = [
            {
                category: 'Access Control',
                priority: 'High',
                items: [
                    'Implement comprehensive access control using OpenZeppelin AccessControl',
                    'Use role-based permissions for different functions',
                    'Implement multi-signature requirements for critical operations'
                ]
            },
            {
                category: 'Reentrancy Protection',
                priority: 'High',
                items: [
                    'Use OpenZeppelin ReentrancyGuard for all external calls',
                    'Follow checks-effects-interactions pattern',
                    'Implement proper state management before external calls'
                ]
            },
            {
                category: 'Input Validation',
                priority: 'Medium',
                items: [
                    'Validate all input parameters',
                    'Implement proper bounds checking',
                    'Use require statements with descriptive error messages'
                ]
            },
            {
                category: 'Gas Optimization',
                priority: 'Medium',
                items: [
                    'Use packed structs for storage efficiency',
                    'Implement batch operations where possible',
                    'Cache frequently accessed storage variables'
                ]
            },
            {
                category: 'Monitoring & Events',
                priority: 'Low',
                items: [
                    'Implement comprehensive event logging',
                    'Add monitoring for critical functions',
                    'Implement circuit breakers for emergency situations'
                ]
            }
        ];

        this.report.recommendations = recommendations;
    }

    async generateReport() {
        console.log('📊 Generating security audit report...');
        
        this.generateRecommendations();
        
        const reportPath = path.join(process.cwd(), 'docs', 'SECURITY_AUDIT_REPORT.md');
        const jsonReportPath = path.join(process.cwd(), 'docs', 'security-audit-report.json');
        
        // Generate Markdown report
        const markdownReport = this.generateMarkdownReport();
        fs.writeFileSync(reportPath, markdownReport);
        
        // Generate JSON report
        fs.writeFileSync(jsonReportPath, JSON.stringify(this.report, null, 2));
        
        console.log(`✅ Security audit report generated:`);
        console.log(`   📄 Markdown: ${reportPath}`);
        console.log(`   📊 JSON: ${jsonReportPath}`);
        
        return this.report;
    }

    generateMarkdownReport() {
        const { summary, vulnerabilities, recommendations } = this.report;
        
        let report = `# Security Audit Report\n\n`;
        report += `**Generated:** ${new Date(this.report.timestamp).toLocaleString()}\n`;
        report += `**Project:** DeFi Cross-Chain Yield Aggregator\n\n`;
        
        // Summary
        report += `## Executive Summary\n\n`;
        report += `| Severity | Count |\n`;
        report += `|----------|-------|\n`;
        report += `| 🔴 High Risk | ${summary.highRisk} |\n`;
        report += `| 🟡 Medium Risk | ${summary.mediumRisk} |\n`;
        report += `| 🟠 Low Risk | ${summary.lowRisk} |\n`;
        report += `| ℹ️ Info | ${summary.info} |\n`;
        report += `| **Total Contracts** | ${summary.totalContracts} |\n\n`;
        
        // Vulnerabilities
        if (vulnerabilities.length > 0) {
            report += `## Vulnerabilities Found\n\n`;
            
            const groupedVulns = this.groupVulnerabilitiesBySeverity(vulnerabilities);
            
            Object.keys(groupedVulns).forEach(severity => {
                const vulns = groupedVulns[severity];
                const emoji = this.getSeverityEmoji(severity);
                report += `### ${emoji} ${severity.toUpperCase()} RISK (${vulns.length})\n\n`;
                
                vulns.forEach(vuln => {
                    report += `#### ${vuln.detector || vuln.type}\n`;
                    report += `- **Description:** ${vuln.description}\n`;
                    if (vuln.recommendation) {
                        report += `- **Recommendation:** ${vuln.recommendation}\n`;
                    }
                    if (vuln.contracts && vuln.contracts.length > 0) {
                        report += `- **Affected Contracts:** ${vuln.contracts.join(', ')}\n`;
                    }
                    report += `\n`;
                });
            });
        }
        
        // Recommendations
        report += `## Security Recommendations\n\n`;
        recommendations.forEach(rec => {
            const emoji = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟠';
            report += `### ${emoji} ${rec.category} (${rec.priority} Priority)\n\n`;
            rec.items.forEach(item => {
                report += `- ${item}\n`;
            });
            report += `\n`;
        });
        
        // Contract Analysis
        report += `## Contract Analysis\n\n`;
        this.report.contracts.forEach(contract => {
            report += `### ${contract.name}\n`;
            report += `- **Path:** \`${contract.path}\`\n`;
            report += `- **Vulnerabilities:** ${contract.vulnerabilities.length}\n`;
            
            if (contract.vulnerabilities.length > 0) {
                report += `- **Issues:**\n`;
                contract.vulnerabilities.forEach(vuln => {
                    const emoji = this.getSeverityEmoji(vuln.severity);
                    report += `  - ${emoji} ${vuln.type}: ${vuln.description}\n`;
                });
            }
            report += `\n`;
        });
        
        // Conclusion
        report += `## Conclusion\n\n`;
        if (summary.highRisk === 0 && summary.mediumRisk === 0) {
            report += `✅ **No critical vulnerabilities found.** The contracts appear to follow security best practices.\n\n`;
        } else {
            report += `⚠️ **${summary.highRisk + summary.mediumRisk} issues require attention** before mainnet deployment.\n\n`;
        }
        
        report += `### Next Steps\n`;
        report += `1. Address all HIGH and MEDIUM risk vulnerabilities\n`;
        report += `2. Implement recommended security measures\n`;
        report += `3. Conduct additional manual code review\n`;
        report += `4. Consider professional security audit for mainnet deployment\n`;
        report += `5. Implement monitoring and emergency procedures\n\n`;
        
        report += `---\n`;
        report += `*This report was generated automatically. For production deployment, consider engaging a professional security audit firm.*\n`;
        
        return report;
    }

    groupVulnerabilitiesBySeverity(vulnerabilities) {
        const grouped = {};
        vulnerabilities.forEach(vuln => {
            if (!grouped[vuln.severity]) {
                grouped[vuln.severity] = [];
            }
            grouped[vuln.severity].push(vuln);
        });
        return grouped;
    }

    getSeverityEmoji(severity) {
        const emojis = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟠',
            'info': 'ℹ️'
        };
        return emojis[severity] || 'ℹ️';
    }

    async run() {
        console.log('🛡️  Starting Security Audit...\n');
        
        try {
            await this.runSlitherAnalysis();
            await this.runCustomVulnerabilityChecks();
            const report = await this.generateReport();
            
            console.log('\n📊 Security Audit Summary:');
            console.log(`   🔴 High Risk: ${report.summary.highRisk}`);
            console.log(`   🟡 Medium Risk: ${report.summary.mediumRisk}`);
            console.log(`   🟠 Low Risk: ${report.summary.lowRisk}`);
            console.log(`   ℹ️ Info: ${report.summary.info}`);
            console.log(`   📄 Total Contracts: ${report.summary.totalContracts}`);
            
            if (report.summary.highRisk > 0) {
                console.log('\n⚠️  HIGH RISK vulnerabilities found! Address before deployment.');
                process.exit(1);
            } else {
                console.log('\n✅ Security audit completed successfully.');
                process.exit(0);
            }
            
        } catch (error) {
            console.error('❌ Security audit failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the security audit
if (require.main === module) {
    const auditor = new SecurityAuditor();
    auditor.run();
}

module.exports = SecurityAuditor;
