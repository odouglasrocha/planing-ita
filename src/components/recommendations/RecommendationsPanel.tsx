import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRecommendations, type RecommendationFilters } from '@/hooks/useRecommendations';
import { 
  Brain, 
  Search, 
  Filter,
  ThumbsUp, 
  ThumbsDown,
  AlertTriangle,
  Settings,
  ShieldCheck,
  Wrench,
  TrendingDown,
  Film,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface RecommendationsPanelProps {
  context?: {
    machineStatus?: string;
    currentProduct?: string;
    recentProblems?: string[];
    operatingConditions?: any;
  };
  compact?: boolean;
}

export function RecommendationsPanel({ context, compact = false }: RecommendationsPanelProps) {
  const {
    recommendations,
    loading,
    submittingFeedback,
    fetchRecommendations,
    submitFeedback,
    getSmartRecommendations,
    getCategoryLabel,
    getPriorityLabel,
    getPriorityColor,
    getCategoryColor,
  } = useRecommendations();

  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (context) {
      getSmartRecommendations(context);
    }
  }, [context]);

  const handleFilterChange = (key: keyof RecommendationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    fetchRecommendations(newFilters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, searchTerm: searchTerm || undefined };
    setFilters(newFilters);
    fetchRecommendations(newFilters);
  };

  const handleRefresh = () => {
    if (context) {
      getSmartRecommendations(context);
    } else {
      fetchRecommendations(filters);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      configuracao: Settings,
      qualidade: ShieldCheck,
      manutencao: Wrench,
      reducao_perdas: TrendingDown,
      otimizacao_filme: Film
    };
    const IconComponent = icons[category as keyof typeof icons] || Settings;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgente') {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const displayedRecommendations = compact 
    ? recommendations.slice(0, 5)
    : recommendations;

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Recomendações IA
            <Badge variant="outline" className="ml-auto">
              Masipack VS 340
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayedRecommendations.length > 0 ? (
                displayedRecommendations.map((rec) => (
                  <Card key={rec.id} className="p-3 bg-muted/50">
                    <div className="flex items-start gap-2 mb-2">
                      {getCategoryIcon(rec.category)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(rec.priority)}`}
                          >
                            {getPriorityLabel(rec.priority)}
                          </Badge>
                          {getPriorityIcon(rec.priority)}
                        </div>
                        <h4 className="font-medium text-sm leading-tight">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(rec.category)}`}
                      >
                        {getCategoryLabel(rec.category)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-green-600 hover:text-green-700"
                          onClick={() => submitFeedback(rec.id, true)}
                          disabled={submittingFeedback === rec.id}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="ml-1">{rec.helpful_votes}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-red-600 hover:text-red-700"
                          onClick={() => submitFeedback(rec.id, false)}
                          disabled={submittingFeedback === rec.id}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span className="ml-1">{rec.not_helpful_votes}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma recomendação encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
          {recommendations.length > 5 && (
            <Button variant="outline" className="w-full mt-3" size="sm">
              Ver todas as {recommendations.length} recomendações
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Recomendações Inteligentes</h1>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Masipack VS 340
          </Badge>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar recomendações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="configuracao">Configurações</SelectItem>
                <SelectItem value="qualidade">Qualidade</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="reducao_perdas">Redução de Perdas</SelectItem>
                <SelectItem value="otimizacao_filme">Otimização de Filme</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading 
            ? 'Carregando recomendações...' 
            : `${recommendations.length} recomendação${recommendations.length !== 1 ? 'ões' : ''} encontrada${recommendations.length !== 1 ? 's' : ''}`
          }
        </span>
        {context && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Recomendações Contextuais
          </Badge>
        )}
      </div>

      {/* Recommendations List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getCategoryIcon(rec.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg leading-tight">{rec.title}</h3>
                          {getPriorityIcon(rec.priority)}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(rec.priority)}
                          >
                            {getPriorityLabel(rec.priority)}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={getCategoryColor(rec.category)}
                          >
                            {getCategoryLabel(rec.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {rec.description}
                    </p>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Esta recomendação foi útil?
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => submitFeedback(rec.id, true)}
                          disabled={submittingFeedback === rec.id}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Útil ({rec.helpful_votes})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => submitFeedback(rec.id, false)}
                          disabled={submittingFeedback === rec.id}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Não útil ({rec.not_helpful_votes})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma recomendação encontrada</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Tente ajustar os filtros ou realizar uma nova busca para encontrar recomendações relevantes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}