import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Download,
  Printer,
  Share2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { interpretRisk } from "@/lib/prevent-equations";

interface PreventResults {
  model: string;
  cvd_10yr: number | null;
  cvd_30yr: number | null;
  ascvd_10yr: number | null;
  ascvd_30yr: number | null;
  hf_10yr: number | null;
  hf_30yr: number | null;
}

interface PreventResultsProps {
  results: PreventResults;
  patientData?: {
    age?: number;
    sex?: number;
    [key: string]: any;
  };
}

// Helper function to get risk color based on percentage
const getRiskColor = (risk: number | null): string => {
  if (risk === null) return '#e2e8f0';
  if (risk < 5) return '#10b981'; // green
  if (risk < 10) return '#f59e0b'; // yellow
  if (risk < 20) return '#f97316'; // orange
  return '#ef4444'; // red
};

// Helper function to get risk level
const getRiskLevel = (risk: number | null): 'low' | 'moderate' | 'high' | 'very-high' | 'unavailable' => {
  if (risk === null) return 'unavailable';
  if (risk < 5) return 'low';
  if (risk < 10) return 'moderate';
  if (risk < 20) return 'high';
  return 'very-high';
};

// Helper function to get risk icon
const getRiskIcon = (level: string) => {
  switch (level) {
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'moderate':
      return <Info className="h-4 w-4 text-yellow-600" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'very-high':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-400" />;
  }
};

// Gauge chart component
const GaugeChart = ({ value, label, color }: { value: number | null; label: string; color: string }) => {
  if (value === null) {
    return (
      <div className="w-full aspect-square flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <span className="text-gray-400 text-sm">N/A</span>
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  }

  const data = [
    { name: 'Risk', value: Math.min(value, 100), fill: color },
    { name: 'Remaining', value: Math.max(100 - value, 0), fill: '#f1f5f9' }
  ];

  return (
    <div className="w-full aspect-square">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={35}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {value.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
};

// Risk comparison chart
const RiskComparisonChart = ({ results }: { results: PreventResults }) => {
  const chartData = [
    {
      name: 'CVD Total',
      '10 anos': results.cvd_10yr || 0,
      '30 anos': results.cvd_30yr || 0,
    },
    {
      name: 'ASCVD',
      '10 anos': results.ascvd_10yr || 0,
      '30 anos': results.ascvd_30yr || 0,
    },
    {
      name: 'Insuf. Cardíaca',
      '10 anos': results.hf_10yr || 0,
      '30 anos': results.hf_30yr || 0,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Risco (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
        <Legend />
        <Bar dataKey="10 anos" fill="oklch(0.45 0.18 280)" />
        <Bar dataKey="30 anos" fill="oklch(0.35 0.15 280)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Export functions
const exportToPDF = (results: PreventResults, patientData?: any) => {
  // Create a formatted report for printing
  const printContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid oklch(0.45 0.18 280); padding-bottom: 20px;">
        <h1 style="color: oklch(0.45 0.18 280); margin-bottom: 10px;">PREVENT Calculator - Relatório</h1>
        <p style="color: #666; font-size: 14px;">American Heart Association - Predição de Risco Cardiovascular</p>
        <p style="color: #666; font-size: 12px;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dados do Paciente</h3>
        <p><strong>Modelo utilizado:</strong> ${results.model === 'full' ? 'PREVENT Completo' : 'PREVENT Base'}</p>
        ${patientData?.age ? `<p><strong>Idade:</strong> ${patientData.age} anos</p>` : ''}
        ${patientData?.sex !== undefined ? `<p><strong>Sexo:</strong> ${patientData.sex === 0 ? 'Masculino' : 'Feminino'}</p>` : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Resultados</h3>
        
        <div style="margin-bottom: 15px;">
          <h4 style="color: oklch(0.45 0.18 280);">Risco Cardiovascular Total (CVD)</h4>
          <p>10 anos: <strong>${results.cvd_10yr !== null ? results.cvd_10yr.toFixed(1) + '%' : 'N/A'}</strong></p>
          <p>30 anos: <strong>${results.cvd_30yr !== null ? results.cvd_30yr.toFixed(1) + '%' : 'N/A'}</strong></p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="color: #f97316;">Risco ASCVD</h4>
          <p>10 anos: <strong>${results.ascvd_10yr !== null ? results.ascvd_10yr.toFixed(1) + '%' : 'N/A'}</strong></p>
          <p>30 anos: <strong>${results.ascvd_30yr !== null ? results.ascvd_30yr.toFixed(1) + '%' : 'N/A'}</strong></p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="color: #06b6d4;">Risco de Insuficiência Cardíaca</h4>
          <p>10 anos: <strong>${results.hf_10yr !== null ? results.hf_10yr.toFixed(1) + '%' : 'N/A'}</strong></p>
          <p>30 anos: <strong>${results.hf_30yr !== null ? results.hf_30yr.toFixed(1) + '%' : 'N/A'}</strong></p>
        </div>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p><strong>Nota:</strong> Este relatório é baseado nas equações PREVENT do American Heart Association.</p>
        <p>Os resultados devem ser interpretados por profissional médico qualificado.</p>
        <p>Gerado por TribeMD Professional PREVENT Calculator</p>
      </div>
    </div>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

const exportToCSV = (results: PreventResults) => {
  const csvData = [
    ['Tipo de Risco', '10 Anos (%)', '30 Anos (%)'],
    ['CVD Total', results.cvd_10yr?.toFixed(1) || 'N/A', results.cvd_30yr?.toFixed(1) || 'N/A'],
    ['ASCVD', results.ascvd_10yr?.toFixed(1) || 'N/A', results.ascvd_30yr?.toFixed(1) || 'N/A'],
    ['Insuficiência Cardíaca', results.hf_10yr?.toFixed(1) || 'N/A', results.hf_30yr?.toFixed(1) || 'N/A']
  ];
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `prevent-results-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  window.URL.revokeObjectURL(url);
};

export default function PreventResults({ results, patientData }: PreventResultsProps) {
  const riskData = [
    {
      type: 'CVD',
      label: 'Cardiovascular Total',
      description: 'Risco de eventos cardiovasculares globais',
      icon: <Heart className="h-5 w-5" />,
      values: {
        '10yr': results.cvd_10yr,
        '30yr': results.cvd_30yr,
      },
      color: 'oklch(0.45 0.18 280)',
    },
    {
      type: 'ASCVD',
      label: 'ASCVD',
      description: 'Doença cardiovascular aterosclerótica',
      icon: <Activity className="h-5 w-5" />,
      values: {
        '10yr': results.ascvd_10yr,
        '30yr': results.ascvd_30yr,
      },
      color: '#f97316',
    },
    {
      type: 'HF',
      label: 'Insuficiência Cardíaca',
      description: 'Risco de desenvolvimento de IC',
      icon: <TrendingUp className="h-5 w-5" />,
      values: {
        '10yr': results.hf_10yr,
        '30yr': results.hf_30yr,
      },
      color: '#06b6d4',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Heart className="h-6 w-6" />
                Resultados PREVENT
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Badge variant={results.model === 'full' ? 'default' : 'secondary'}>
                  Modelo {results.model === 'full' ? 'Completo' : 'Base'}
                </Badge>
                {results.model === 'full' && (
                  <span className="text-sm text-muted-foreground">
                    Incluindo variáveis opcionais para maior precisão
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToPDF(results, patientData)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(results)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Results */}
      <Tabs defaultValue="detailed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed">Resultados Detalhados</TabsTrigger>
          <TabsTrigger value="comparison">Comparação Visual</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-6">
          {riskData.map((risk) => (
            <Card key={risk.type} className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {risk.icon}
                  {risk.label}
                </CardTitle>
                <CardDescription>{risk.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 10-year risk */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risco em 10 anos</span>
                      <div className="flex items-center gap-2">
                        {getRiskIcon(getRiskLevel(risk.values['10yr']))}
                        <span className="text-lg font-bold" style={{ color: risk.color }}>
                          {risk.values['10yr'] !== null ? `${risk.values['10yr'].toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {risk.values['10yr'] !== null && (
                      <>
                        <Progress 
                          value={Math.min(risk.values['10yr'], 100)} 
                          className="h-3"
                          style={{ 
                            backgroundColor: '#f1f5f9',
                          }}
                        />
                        <div className="text-sm text-muted-foreground">
                          {interpretRisk(risk.values['10yr'], risk.type as any, '10yr')}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 30-year risk */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risco em 30 anos</span>
                      <div className="flex items-center gap-2">
                        {getRiskIcon(getRiskLevel(risk.values['30yr']))}
                        <span className="text-lg font-bold" style={{ color: risk.color }}>
                          {risk.values['30yr'] !== null ? `${risk.values['30yr'].toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {risk.values['30yr'] !== null ? (
                      <>
                        <Progress 
                          value={Math.min(risk.values['30yr'], 100)} 
                          className="h-3"
                        />
                        <div className="text-sm text-muted-foreground">
                          {interpretRisk(risk.values['30yr'], risk.type as any, '30yr')}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Disponível apenas para idades ≤59 anos
                      </div>
                    )}
                  </div>
                </div>

                {/* Gauge Charts */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="relative">
                    <GaugeChart 
                      value={risk.values['10yr']} 
                      label="10 anos" 
                      color={getRiskColor(risk.values['10yr'])}
                    />
                  </div>
                  <div className="relative">
                    <GaugeChart 
                      value={risk.values['30yr']} 
                      label="30 anos" 
                      color={getRiskColor(risk.values['30yr'])}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparação de Riscos
              </CardTitle>
              <CardDescription>
                Visualização comparativa dos diferentes tipos de risco cardiovascular
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskComparisonChart results={results} />
            </CardContent>
          </Card>

          {/* Clinical Interpretation */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Interpretação Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-blue-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">CVD Total (Mais Abrangente)</h4>
                  <p className="text-sm">
                    Inclui todos os eventos cardiovasculares: doença coronária, AVC, 
                    insuficiência cardíaca e doença arterial periférica.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">ASCVD (Guideline AHA/ACC)</h4>
                  <p className="text-sm">
                    Foco em doença aterosclerótica: IAM, AVC isquêmico e 
                    morte cardiovascular. Base para decisões de estatina.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Considerações para Conduta:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>ASCVD ≥7.5% (10 anos): considerar estatina de alta intensidade</li>
                  <li>ASCVD ≥20% (10 anos): estatina + ezetimiba, considerar inibidores PCSK9</li>
                  <li>Riscos elevados justificam intervenções mais agressivas</li>
                  <li>Avaliar sempre benefício vs. risco individual</li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-700">✓ Fatores Protetivos</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Uso adequado de estatinas</li>
                    <li>Controle pressórico otimizado</li>
                    <li>Atividade física regular</li>
                    <li>Dieta mediterrânea</li>
                    <li>Abandono do tabagismo</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-700">⚠ Fatores de Risco Modificáveis</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Hipertensão arterial</li>
                    <li>Diabetes mellitus</li>
                    <li>Dislipidemia</li>
                    <li>Tabagismo</li>
                    <li>Obesidade (IMC ≥30)</li>
                    <li>Doença renal crônica</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Treatment Recommendations */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recomendações Baseadas em Evidência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-green-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <h5 className="font-medium mb-2 text-red-600">Risco Alto (ASCVD ≥20%)</h5>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Estatina alta intensidade</li>
                    <li>Ezetimiba se LDL &gt;70 mg/dL</li>
                    <li>Meta PA &lt;130/80 mmHg</li>
                    <li>HbA1c &lt;7% se diabético</li>
                    <li>Consider inh. PCSK9</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <h5 className="font-medium mb-2 text-orange-600">Risco Intermediário (7.5-20%)</h5>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Estatina moderada/alta</li>
                    <li>Meta LDL &lt;100 mg/dL</li>
                    <li>Controle rigoroso FA</li>
                    <li>Avaliar CAC se dúvida</li>
                    <li>Aspirina se apropriado</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <h5 className="font-medium mb-2 text-green-600">Risco Baixo (&lt;7.5%)</h5>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Estilo de vida saudável</li>
                    <li>Dieta mediterrânea</li>
                    <li>Exercício 150min/semana</li>
                    <li>Monitoramento periódico</li>
                    <li>Estatina se FA adicionais</li>
                  </ul>
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Estas são diretrizes gerais. A decisão terapêutica deve sempre considerar 
                  o contexto clínico individual, preferências do paciente, comorbidades e risco de sangramento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Additional Clinical Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seguimento e Monitoramento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Reavaliação Periódica (Sugestão)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Perfil lipídico:</span>
                  <span className="font-medium">6-12 semanas após mudança</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Pressão arterial:</span>
                  <span className="font-medium">Mensal até meta</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>HbA1c (se diabético):</span>
                  <span className="font-medium">3-6 meses</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Função renal:</span>
                  <span className="font-medium">Anualmente</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Metas Terapêuticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                  <span>LDL-C (risco alto):</span>
                  <span className="font-medium text-primary">&lt;70 mg/dL</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                  <span>PA (geral):</span>
                  <span className="font-medium text-primary">&lt;130/80 mmHg</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                  <span>HbA1c (diabetes):</span>
                  <span className="font-medium text-primary">&lt;7%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                  <span>IMC:</span>
                  <span className="font-medium text-primary">18.5-24.9 kg/m²</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}