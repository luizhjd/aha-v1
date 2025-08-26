import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Heart, Calculator, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { calculatePreventRisk } from "@/lib/prevent-equations";
import PreventResults from "@/components/PreventResults";

interface PreventInputs {
  sex: string;
  age: string;
  tc: string;
  hdl: string;
  sbp: string;
  dm: string;
  smoking: string;
  bmi: string;
  egfr: string;
  bptreat: string;
  statin: string;
  uacr: string;
  hba1c: string;
  sdi: string;
}

interface PreventResults {
  model: string;
  cvd_10yr: number | null;
  cvd_30yr: number | null;
  ascvd_10yr: number | null;
  ascvd_30yr: number | null;
  hf_10yr: number | null;
  hf_30yr: number | null;
}

export default function PreventCalculator() {
  const [inputs, setInputs] = useState<PreventInputs>({
    sex: '',
    age: '',
    tc: '',
    hdl: '',
    sbp: '',
    dm: '',
    smoking: '',
    bmi: '',
    egfr: '',
    bptreat: '',
    statin: '',
    uacr: '',
    hba1c: '',
    sdi: ''
  });

  const [results, setResults] = useState<PreventResults | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof PreventInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear results when inputs change
    setResults(null);
    setErrors([]);
  };

  const validateInputs = (): string[] => {
    const validationErrors: string[] = [];

    // Required fields validation
    if (!inputs.sex) validationErrors.push("Sexo é obrigatório");
    if (!inputs.age) validationErrors.push("Idade é obrigatória");
    if (!inputs.sbp) validationErrors.push("Pressão arterial sistólica é obrigatória");
    if (!inputs.dm) validationErrors.push("Status de diabetes é obrigatório");
    if (!inputs.smoking) validationErrors.push("Status de tabagismo é obrigatório");
    if (!inputs.egfr) validationErrors.push("eGFR é obrigatório");
    if (!inputs.bptreat) validationErrors.push("Tratamento de hipertensão é obrigatório");

    // Range validations
    if (inputs.age && (Number(inputs.age) < 30 || Number(inputs.age) > 79)) {
      validationErrors.push("Idade deve estar entre 30-79 anos");
    }
    
    if (inputs.tc && (Number(inputs.tc) < 130 || Number(inputs.tc) > 320)) {
      validationErrors.push("Colesterol total deve estar entre 130-320 mg/dL");
    }
    
    if (inputs.hdl && (Number(inputs.hdl) < 20 || Number(inputs.hdl) > 100)) {
      validationErrors.push("HDL deve estar entre 20-100 mg/dL");
    }
    
    if (inputs.sbp && (Number(inputs.sbp) < 90 || Number(inputs.sbp) > 200)) {
      validationErrors.push("PAS deve estar entre 90-200 mmHg");
    }
    
    if (inputs.bmi && (Number(inputs.bmi) < 18.5 || Number(inputs.bmi) >= 40)) {
      validationErrors.push("IMC deve estar entre 18.5-39.9 kg/m²");
    }
    
    if (inputs.egfr && Number(inputs.egfr) <= 0) {
      validationErrors.push("eGFR deve ser maior que 0");
    }
    
    if (inputs.uacr && Number(inputs.uacr) < 0) {
      validationErrors.push("UACR deve ser ≥ 0");
    }
    
    if (inputs.hba1c && Number(inputs.hba1c) <= 0) {
      validationErrors.push("HbA1c deve ser > 0");
    }
    
    if (inputs.sdi && (Number(inputs.sdi) < 1 || Number(inputs.sdi) > 10)) {
      validationErrors.push("SDI deve estar entre 1-10");
    }

    return validationErrors;
  };

  const calculateRisk = () => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    
    // Convert string inputs to numbers for PREVENT calculation
    const preventInputs = {
      sex: Number(inputs.sex),
      age: Number(inputs.age),
      tc: inputs.tc ? Number(inputs.tc) : undefined,
      hdl: inputs.hdl ? Number(inputs.hdl) : undefined,
      sbp: Number(inputs.sbp),
      dm: Number(inputs.dm),
      smoking: Number(inputs.smoking),
      bmi: inputs.bmi ? Number(inputs.bmi) : undefined,
      egfr: Number(inputs.egfr),
      bptreat: Number(inputs.bptreat),
      statin: inputs.statin ? Number(inputs.statin) : undefined,
      uacr: inputs.uacr ? Number(inputs.uacr) : undefined,
      hba1c: inputs.hba1c ? Number(inputs.hba1c) : undefined,
      sdi: inputs.sdi ? Number(inputs.sdi) : undefined,
    };

    // Calculate PREVENT risk using official equations
    const preventResults = calculatePreventRisk(preventInputs);
    
    // Convert to interface format
    const formattedResults: PreventResults = {
      model: preventResults.model,
      cvd_10yr: preventResults.prevent_10yr_CVD ? Number(preventResults.prevent_10yr_CVD.toFixed(1)) : null,
      cvd_30yr: preventResults.prevent_30yr_CVD ? Number(preventResults.prevent_30yr_CVD.toFixed(1)) : null,
      ascvd_10yr: preventResults.prevent_10yr_ASCVD ? Number(preventResults.prevent_10yr_ASCVD.toFixed(1)) : null,
      ascvd_30yr: preventResults.prevent_30yr_ASCVD ? Number(preventResults.prevent_30yr_ASCVD.toFixed(1)) : null,
      hf_10yr: preventResults.prevent_10yr_HF ? Number(preventResults.prevent_10yr_HF.toFixed(1)) : null,
      hf_30yr: preventResults.prevent_30yr_HF ? Number(preventResults.prevent_30yr_HF.toFixed(1)) : null,
    };
    
    setResults(formattedResults);
  };

  const clearForm = () => {
    setInputs({
      sex: '',
      age: '',
      tc: '',
      hdl: '',
      sbp: '',
      dm: '',
      smoking: '',
      bmi: '',
      egfr: '',
      bptreat: '',
      statin: '',
      uacr: '',
      hba1c: '',
      sdi: ''
    });
    setResults(null);
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="text-center py-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              PREVENT Calculator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculadora oficial do American Heart Association para predição de risco cardiovascular
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-xs">
              <span className="font-medium">TribeMD Professional</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Dados do Paciente
                </CardTitle>
                <CardDescription>
                  Preencha os dados clínicos para calcular o risco cardiovascular
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="required" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="required">Dados Obrigatórios</TabsTrigger>
                    <TabsTrigger value="optional">Dados Opcionais</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="required" className="space-y-4 mt-6">
                    {/* Demographics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sex">Sexo *</Label>
                        <Select value={inputs.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Masculino</SelectItem>
                            <SelectItem value="1">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="age">Idade (anos) *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="30-79 anos"
                          value={inputs.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          min="30"
                          max="79"
                        />
                      </div>
                    </div>

                    {/* Cholesterol */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tc">Colesterol Total (mg/dL)</Label>
                        <Input
                          id="tc"
                          type="number"
                          placeholder="130-320"
                          value={inputs.tc}
                          onChange={(e) => handleInputChange('tc', e.target.value)}
                          min="130"
                          max="320"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hdl">HDL-C (mg/dL)</Label>
                        <Input
                          id="hdl"
                          type="number"
                          placeholder="20-100"
                          value={inputs.hdl}
                          onChange={(e) => handleInputChange('hdl', e.target.value)}
                          min="20"
                          max="100"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="statin">Uso de Estatina</Label>
                        <Select value={inputs.statin} onValueChange={(value) => handleInputChange('statin', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Não</SelectItem>
                            <SelectItem value="1">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Blood Pressure & Diabetes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sbp">PAS (mmHg) *</Label>
                        <Input
                          id="sbp"
                          type="number"
                          placeholder="90-200"
                          value={inputs.sbp}
                          onChange={(e) => handleInputChange('sbp', e.target.value)}
                          min="90"
                          max="200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bptreat">Tratamento HAS *</Label>
                        <Select value={inputs.bptreat} onValueChange={(value) => handleInputChange('bptreat', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Não</SelectItem>
                            <SelectItem value="1">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dm">Diabetes *</Label>
                        <Select value={inputs.dm} onValueChange={(value) => handleInputChange('dm', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Não</SelectItem>
                            <SelectItem value="1">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Physical & Lifestyle */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bmi">IMC (kg/m²)</Label>
                        <Input
                          id="bmi"
                          type="number"
                          placeholder="18.5-39.9"
                          value={inputs.bmi}
                          onChange={(e) => handleInputChange('bmi', e.target.value)}
                          min="18.5"
                          max="39.9"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="egfr">eGFR (mL/min/1.73m²) *</Label>
                        <Input
                          id="egfr"
                          type="number"
                          placeholder="> 0"
                          value={inputs.egfr}
                          onChange={(e) => handleInputChange('egfr', e.target.value)}
                          min="1"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smoking">Tabagismo *</Label>
                        <Select value={inputs.smoking} onValueChange={(value) => handleInputChange('smoking', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Não</SelectItem>
                            <SelectItem value="1">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="optional" className="space-y-4 mt-6">
                    <div className="text-sm text-muted-foreground mb-4">
                      <Info className="h-4 w-4 inline mr-2" />
                      Variáveis opcionais permitem cálculo mais preciso (modelo PREVENT completo)
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="uacr">UACR (mg/g)</Label>
                        <Input
                          id="uacr"
                          type="number"
                          placeholder="≥ 0"
                          value={inputs.uacr}
                          onChange={(e) => handleInputChange('uacr', e.target.value)}
                          min="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hba1c">HbA1c (%)</Label>
                        <Input
                          id="hba1c"
                          type="number"
                          placeholder="> 0"
                          value={inputs.hba1c}
                          onChange={(e) => handleInputChange('hba1c', e.target.value)}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sdi">SDI (decil)</Label>
                        <Select value={inputs.sdi} onValueChange={(value) => handleInputChange('sdi', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="1-10" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1} {i + 1 <= 3 ? '(Baixo)' : i + 1 <= 6 ? '(Médio)' : '(Alto)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />
                
                <div className="flex gap-3">
                  <Button onClick={calculateRisk} className="flex-1">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Risco
                  </Button>
                  <Button variant="outline" onClick={clearForm}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results & Errors */}
          <div className="space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {results && (
              <PreventResults 
                results={results} 
                patientData={{
                  age: Number(inputs.age),
                  sex: Number(inputs.sex)
                }}
              />
            )}

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary text-base">Sobre PREVENT</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>A calculadora PREVENT é a ferramenta oficial do AHA para predição de risco cardiovascular.</p>
                <p>Campos marcados com * são obrigatórios para o modelo base.</p>
                <p>Dados opcionais melhoram a precisão através do modelo completo.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
