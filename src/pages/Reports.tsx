import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Factory,
  Clock
} from "lucide-react";
import { useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useMachines } from "@/hooks/useMachines";

// Mock KPI data - em produção viria do Supabase
const kpiData = [
  { label: "OEE Médio", value: "83.4%", trend: "+2.1%", color: "text-blue-600" },
  { label: "Disponibilidade", value: "87.5%", trend: "+1.8%", color: "text-green-600" },
  { label: "Performance", value: "92.3%", trend: "+0.7%", color: "text-blue-600" },
  { label: "Qualidade", value: "78.1%", trend: "-1.2%", color: "text-red-600" },
  { label: "Produção Total", value: "45,230", trend: "+5.3%", color: "text-green-600" },
  { label: "Perdas Total", value: "273 kg", trend: "-8.9%", color: "text-green-600" }
];

const iconMap: Record<string, any> = {
  BarChart3,
  Factory,
  AlertTriangle,
  Clock
};

export default function Reports() {
  const { reports, reportTemplates, loading, generateReport, downloadReport, formatFileSize } = useReports();
  const { machines } = useMachines();
  const [selectedReport, setSelectedReport] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [format, setFormat] = useState("pdf");

  const handleGenerateReport = () => {
    if (!selectedReport) return;
    
    generateReport({
      type: selectedReport,
      dateFrom,
      dateTo,
      machineId: selectedMachine,
      format
    });
  };

  const handleDownloadReport = (reportId: string) => {
    downloadReport(reportId);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios e Análises</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gere relatórios personalizados e acompanhe KPIs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {reports.length} relatórios recentes
            </span>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className={`h-3 w-3 ${kpi.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs ${kpi.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {kpi.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Report Generator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Gerar Relatório
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Tipo de Relatório *</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar relatório" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">Data Início</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">Data Fim</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machine">Máquina</Label>
                   <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                     <SelectTrigger>
                       <SelectValue placeholder="Todas as máquinas" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="">Todas as máquinas</SelectItem>
                       {machines.map((machine) => (
                         <SelectItem key={machine.id} value={machine.id}>
                           {machine.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Formato</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateReport}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!selectedReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Templates & Recent Reports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Relatório</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTemplates.map((template) => {
                    const IconComponent = iconMap[template.icon];
                    return (
                      <div 
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedReport === template.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedReport(template.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 ${template.color} rounded-lg text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Relatórios Recentes
                  </CardTitle>
                  <Badge variant="outline">
                    {reports.length} arquivos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>{formatFileSize(report.file_size)}</span>
                            <Badge variant="outline" className="text-xs">
                              {report.format.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant={report.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {report.status === 'completed' ? 'Concluído' : 
                               report.status === 'generating' ? 'Gerando...' : 'Falhou'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(report.id)}
                        disabled={report.status !== 'completed'}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}